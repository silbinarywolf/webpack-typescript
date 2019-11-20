package server

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"

	"github.com/silbinarywolf/webpack-typescript/server/internal/assetdir"
	"github.com/silbinarywolf/webpack-typescript/server/internal/datatype"
	"github.com/silbinarywolf/webpack-typescript/server/internal/db"
	"github.com/silbinarywolf/webpack-typescript/server/internal/schema"
)

var (
	indexHtml []byte

	dataModelInfoList []DataModelInfo
	formModelMap      = make(map[string]FormModel)
)

type DataModelInfo struct {
	DataModel *schema.DataModel
	FormModel FormModel
}

type FormModel struct {
	Fields []FormFieldModel `json:"fields"`
}

type FormFieldModel struct {
	Type     string           `json:"type"`
	Name     string           `json:"name"`
	Label    string           `json:"label"`
	Children []FormFieldModel `json:"children"`

	// Model is used by RecordField only
	Model string `json:"model"`
}

type ModelListResponse struct {
	DataModels []*schema.DataModel `json:"dataModels"`
}

type ResponseWithData struct {
	Data interface{} `json:"data"`
}

type RecordGetResponse struct {
	Data struct {
		ID    uint64 `json:"id"`
		Model string `json:"model"`
	} `json:"data"`
	Records    map[string]map[uint64]interface{} `json:"records"`
	FormModels map[string]FormModel              `json:"formModels"`
}

type RecordListResponse struct {
	ResponseWithData
	DataModel *schema.DataModel `json:"dataModel"`
}

type RecordSaveResponse struct {
	ResponseWithData
	Errors map[string]string `json:"errors"`
}

func Start() {
	flag.Parse()

	if err := schema.LoadAll(); err != nil {
		fmt.Println(err)
		os.Exit(0)
		return
	}

	// TODO(Jake): 2019-10-27
	// Maybe a system to watch model files so that schema can be updated on the fly

	// Init dataModelInfoList
	{
		dataModels := schema.DataModels()
		for _, dataModel := range dataModels {
			formModel, err := createFormModel(dataModel)
			if err != nil {
				fmt.Printf("Error loading model: %s\n%s", dataModel.Table, err)
				os.Exit(0)
				return
			}
			dataModelInfoList = append(dataModelInfoList, DataModelInfo{
				DataModel: dataModel,
				FormModel: formModel,
			})
			formModelMap[dataModel.Table] = formModel
		}
	}

	http.HandleFunc("/api/model/list", func(w http.ResponseWriter, r *http.Request) {
		ModelListModelHandler(w, r, dataModelInfoList)
	})
	for _, dataModelInfo := range dataModelInfoList {
		dataModelInfo := dataModelInfo

		apiName := dataModelInfo.DataModel.Table
		http.HandleFunc("/api/record/"+apiName+"/list", func(w http.ResponseWriter, r *http.Request) {
			ListModelHandler(w, r, dataModelInfo)
		})
		http.HandleFunc("/api/record/"+apiName+"/get/", func(w http.ResponseWriter, r *http.Request) {
			GetModelHandler(w, r, dataModelInfo)
		})
		http.HandleFunc("/api/record/"+apiName+"/update/", func(w http.ResponseWriter, r *http.Request) {
			UpdateModelHandler(w, r, dataModelInfo)
		})
	}
	fmt.Printf("Starting server on :8080...\n")
	http.ListenAndServe(":8080", nil)
}

func handleCors(w *http.ResponseWriter, req *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
}

func addFieldsFromDataModel(dataModel *schema.DataModel, fields *[]FormFieldModel) {
	for _, field := range dataModel.Fields {
		typeInfo, ok, _ := datatype.Get(field.Type)
		if !ok {
			panic("Cannot get type from model. This should be impossible.")
		}
		formFieldModel := typeInfo.FormFieldModel()
		if dataModel, ok := typeInfo.(*schema.DataModel); ok {
			if formFieldModel != "RecordField" {
				panic("Should not happen. Probably need to fix/adjust things")
			}
			field := FormFieldModel{
				Type:  formFieldModel, // ie. "RecordField",
				Name:  field.Name,
				Label: field.Name,
				Model: dataModel.Table,
			}
			addFieldsFromDataModel(dataModel, &field.Children)
			*fields = append(*fields, field)
			continue
		}
		if field.Readonly {
			formFieldModel = "HiddenField"
		}
		*fields = append(*fields, FormFieldModel{
			Type:  formFieldModel, // ie. "TextField",
			Name:  field.Name,
			Label: field.Name,
		})
	}
}

func createFormModel(dataModel *schema.DataModel) (FormModel, error) {
	var res FormModel
	addFieldsFromDataModel(dataModel, &res.Fields)
	/*if len(res.Actions) == 0 {
		res.Actions = append(res.Actions, FormFieldModel{
			Type:  "Button",
			Name:  "update",
			Label: "Save",
		})
	}*/
	return res, nil
}

func parseIdFromURL(path string) (uint64, error) {
	v := strings.Split(path, "/")
	if len(v) == 0 {
		return 0, errors.New("Failed to parse id: " + path)
	}
	lastPart := v[len(v)-1]
	id, err := strconv.ParseUint(lastPart, 10, 64)
	if err != nil {
		return 0, err
	}
	return id, nil
}

func ModelListModelHandler(w http.ResponseWriter, r *http.Request, dataModels []DataModelInfo) {
	if r.Body == nil {
		http.Error(w, "Please send a request body", 400)
		return
	}
	handleCors(&w, r)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Please send a "+http.MethodGet+" request", 400)
		return
	}
	res := ModelListResponse{}
	for _, dataModelInfo := range dataModels {
		res.DataModels = append(res.DataModels, dataModelInfo.DataModel)
	}
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func GetModelHandler(w http.ResponseWriter, r *http.Request, dataModelInfo DataModelInfo) {
	if r.Body == nil {
		http.Error(w, "Please send a request body", 400)
		return
	}
	handleCors(&w, r)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Please send a "+http.MethodGet+" request", 400)
		return
	}

	// Parse ID
	newID, err := parseIdFromURL(r.URL.Path)
	if err != nil {
		http.Error(w, "Invalid ID, cannot parse given number: "+err.Error(), 400)
		return
	}

	dataModel := dataModelInfo.DataModel

	// Get record
	res := RecordGetResponse{}
	res.Data.Model = dataModel.Table
	res.FormModels = make(map[string]FormModel)
	record := dataModel.NewPointer()
	if newID != 0 {
		err = db.GetByID(dataModel.Table, strconv.FormatUint(newID, 10), record)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		res.Data.ID = newID
	}

	// Query dependencies
	{
		res.Records = make(map[string]map[uint64]interface{})

		// Add record
		{
			modelName := dataModel.Table
			recordMap, ok := res.Records[modelName]
			if !ok {
				recordMap = make(map[uint64]interface{})
				res.Records[modelName] = recordMap
			}
			if _, ok := recordMap[newID]; !ok {
				recordMap[newID] = record
			}
			if _, ok := res.FormModels[dataModel.Table]; !ok {
				res.FormModels[dataModel.Table] = formModelMap[dataModel.Table]
			}
		}

		// Query dependencies
		v := reflect.ValueOf(record).Elem()
		t := reflect.TypeOf(record).Elem()
		for i := 0; i < t.NumField(); i++ {
			field := t.Field(i)
			if modelName := field.Tag.Get("model"); modelName != "" {
				id, ok := v.Field(i).Interface().(uint64)
				if !ok {
					panic("Should be uint64")
				}
				recordMap, ok := res.Records[modelName]
				if !ok {
					recordMap = make(map[uint64]interface{})
					res.Records[modelName] = recordMap
				}
				if _, ok := recordMap[id]; ok {
					// If already loaded, skip re-querying
					continue
				}
				dataType, ok, _ := datatype.Get(modelName)
				if !ok {
					panic("Unexpected error. \"model\" tagged cannot be found: " + modelName)
				}
				dataModel, ok := dataType.(*schema.DataModel)
				if !ok {
					panic("Unexpected error. Cannot assert data type as model: " + modelName)
				}
				newRecord := dataModel.NewPointer()
				if id > 0 {
					err = db.GetByID(modelName, strconv.FormatUint(id, 10), newRecord)
					if err != nil {
						http.Error(w, err.Error(), 500)
						return
					}
				}
				recordMap[id] = newRecord
				if _, ok := res.FormModels[dataModel.Table]; !ok {
					res.FormModels[dataModel.Table] = formModelMap[dataModel.Table]
				}
				//fmt.Printf("model: %d %s, %v (%T)\n", id, modelName, newRecord, newRecord)
			}
		}
	}

	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func ListModelHandler(w http.ResponseWriter, r *http.Request, dataModelInfo DataModelInfo) {
	if r.Body == nil {
		http.Error(w, "Please send a request body", 400)
		return
	}
	handleCors(&w, r)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Please send a "+http.MethodGet+" request", 400)
		return
	}

	dataModel := dataModelInfo.DataModel

	res := RecordListResponse{}
	res.DataModel = dataModel
	res.Data = dataModel.NewSliceOfRecords()

	// Load all records
	if err := db.GetAll(dataModel, &res.Data); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func UpdateModelHandler(w http.ResponseWriter, r *http.Request, dataModelInfo DataModelInfo) {
	if r.Body == nil {
		http.Error(w, "Please send a request body", 400)
		return
	}
	handleCors(&w, r)
	if r.Method == http.MethodOptions {
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Please send a "+http.MethodPost+" request", 400)
		return
	}

	dataModel := dataModelInfo.DataModel

	// Decode using dynamic record struct
	record := dataModel.NewPointer()
	{
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&record); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
	}

	// Get save directory
	dir := filepath.Join(assetdir.DatabaseDir(), dataModel.Table)
	dirExists := false
	{
		_, err := os.Stat(dir)
		dirExists = !os.IsNotExist(err)
	}

	// Parse ID
	newID, err := parseIdFromURL(r.URL.Path)
	if err != nil {
		http.Error(w, "Invalid ID, cannot parse given number: "+err.Error(), 400)
		return
	}
	if newID == 0 {
		// Get new ID
		// Consider using this instead:
		// - https://github.com/sony/sonyflake
		if dirExists {
			err = filepath.Walk(dir, func(filename string, f os.FileInfo, err error) error {
				if filepath.Ext(filename) == ".json" {
					idString := filepath.Base(filename)
					idString = strings.TrimSuffix(idString, filepath.Ext(idString))
					id, err := strconv.ParseUint(idString, 10, 64)
					if err != nil {
						// Throw error if invalid file is in this folder.
						return err
					}
					if newID <= id {
						newID = id + 1
					}
				}
				return err
			})
			if err != nil {
				http.Error(w, "Cannot determine next ID: "+err.Error(), 500)
				return
			}
		}
		if newID == 0 {
			// If first record
			newID = 1
		}
	}

	// Set ID
	{
		ps := reflect.ValueOf(record).Elem()
		f := ps.FieldByName("ID")
		if !f.IsValid() {
			http.Error(w, "ID is missing on struct", 500)
			return
		}
		if f.OverflowUint(newID) {
			http.Error(w, "Not allowed to overflow", 500)
			return
		}
		f.SetUint(newID)
	}

	res := RecordSaveResponse{}
	res.Data = record
	/*if title, _ := res.Data["Title"]; title == "" {
		// Set default Title (testing that values can come from the server)
		res.Data["Title"] = "New Page Title"
	}*/
	res.Errors = make(map[string]string)
	{
		if !dirExists {
			os.MkdirAll(dir, 0700)
		}
		// Write file
		file, _ := json.MarshalIndent(res.Data, "", "	")
		idString := strconv.FormatUint(newID, 10)
		if err := ioutil.WriteFile(path.Join(assetdir.DatabaseDir(), dataModel.Table, idString+".json"), file, 0644); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
	}
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func RootPath(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "%s", indexHtml)
}

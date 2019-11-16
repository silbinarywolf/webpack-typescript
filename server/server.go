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
)

type FormModel struct {
	Fields  []FormFieldModel `json:"fields"`
	Actions []FormFieldModel `json:"actions"`
}

type FormFieldModel struct {
	Type  string `json:"type"`
	Name  string `json:"name"`
	Label string `json:"label"`
}

type ModelListResponse struct {
	DataModels []*schema.DataModel `json:"dataModels"`
}

type ResponseWithData struct {
	Data interface{} `json:"data"`
}

type RecordGetResponse struct {
	ResponseWithData
	FormModel FormModel `json:"formModel"`
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

	dataModels := schema.DataModels()

	// TODO(Jake): 2019-11-07
	// Add logic here to validate against field types. DataModel + Field Type should
	// not clash.
	/*for _, dataModel := range dataModels {
		datatype.Get(dataModel.Name)
		r, _ := utf8.DecodeRuneInString(dataModel.Name[0:])
		if !unicode.IsUpper(r) {
			panic("Invalid DataModel, must start with a capital letter: " + dataModel.Name)
		}
	}*/

	http.HandleFunc("/api/model/list", func(w http.ResponseWriter, r *http.Request) {
		ModelListModelHandler(w, r, dataModels)
	})
	for _, dataModel := range dataModels {
		dataModel := dataModel
		formModel, err := createFormModel(dataModel)
		if err != nil {
			fmt.Printf("Error loading model: %s\n%s", dataModel.Table, err)
			os.Exit(0)
			return
		}

		apiName := dataModel.Table
		http.HandleFunc("/api/record/"+apiName+"/list", func(w http.ResponseWriter, r *http.Request) {
			ListModelHandler(w, r, dataModel)
		})
		http.HandleFunc("/api/record/"+apiName+"/get/", func(w http.ResponseWriter, r *http.Request) {
			GetModelHandler(w, r, dataModel, formModel)
		})
		http.HandleFunc("/api/record/"+apiName+"/update/", func(w http.ResponseWriter, r *http.Request) {
			UpdateModelHandler(w, r, dataModel, formModel)
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

func createFormModel(dataModel *schema.DataModel) (FormModel, error) {
	var res FormModel
	for _, field := range dataModel.Fields {
		typeInfo, ok := datatype.Get(field.Type)
		if !ok {
			panic("Cannot get type from model. This should be impossible.")
		}
		formFieldModel := typeInfo.FormFieldModel()
		if field.Readonly {
			formFieldModel = "HiddenField"
		}
		res.Fields = append(res.Fields, FormFieldModel{
			Type:  formFieldModel, // ie. "TextField",
			Name:  field.Name,
			Label: field.Name,
		})
	}
	if len(res.Actions) == 0 {
		res.Actions = append(res.Actions, FormFieldModel{
			Type:  "Button",
			Name:  "update",
			Label: "Save",
		})
	}
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

func ModelListModelHandler(w http.ResponseWriter, r *http.Request, dataModels []*schema.DataModel) {
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
	res.DataModels = dataModels
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func GetModelHandler(w http.ResponseWriter, r *http.Request, dataModel *schema.DataModel, formModel FormModel) {
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

	res := RecordGetResponse{}
	res.Data = dataModel.NewRecord()
	res.FormModel = formModel

	// Parse ID
	newID, err := parseIdFromURL(r.URL.Path)
	if err != nil {
		http.Error(w, "Invalid ID, cannot parse given number: "+err.Error(), 400)
		return
	}
	if newID == 0 {
		// New record
		jsonOutput, err := json.Marshal(&res)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Write(jsonOutput)
		return
	}
	err = db.GetByID(dataModel.Table, strconv.FormatUint(newID, 10), &res.Data)
	if err != nil {
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

func ListModelHandler(w http.ResponseWriter, r *http.Request, dataModel *schema.DataModel) {
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

func UpdateModelHandler(w http.ResponseWriter, r *http.Request, dataModel *schema.DataModel, formModel FormModel) {
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

	// Decode using dynamic record struct
	record := dataModel.NewRecord()
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

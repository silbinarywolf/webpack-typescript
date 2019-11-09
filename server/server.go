package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/silbinarywolf/webpack-typescript/server/internal/datatype"
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
	DataModels []schema.DataModel `json:"dataModels"`
}

type RecordGetResponse struct {
	FormModel FormModel     `json:"formModel"`
	Data      schema.Record `json:"data"`
}

type RecordListResponse struct {
	DataModel schema.DataModel `json:"dataModel"`
	Data      []schema.Record  `json:"data"`
}

type RecordSaveResponse struct {
	Data   map[string]interface{} `json:"data"`
	Errors map[string]string      `json:"errors"`
}

func Start() {
	schema.LoadAll()

	// TODO(Jake): 2019-10-27
	// Maybe a system to watch model files so that schema can be updated on the fly

	dataModels := schema.DataModels()

	// TODO(Jake): 2019-11-07
	// Add logic here to validate against field types. DataModel + Field Type should
	// not clash.
	for _, dataModel := range dataModels {
		r, _ := utf8.DecodeRuneInString(dataModel.Name[0:])
		if !unicode.IsUpper(r) {
			panic("Invalid DataModel, must start with a capital letter: " + dataModel.Name)
		}
	}

	http.HandleFunc("/api/model/list", func(w http.ResponseWriter, r *http.Request) {
		ModelListModelHandler(w, r, dataModels)
	})
	for _, dataModel := range dataModels {
		dataModel := dataModel
		name := dataModel.Name
		formModel, err := createFormModel(dataModel)
		if err != nil {
			// TODO(jake): 2019-10-27
			// make this error message nicer
			fmt.Printf("An error occurred building form model from data model: %s\n%s", name, err)
			os.Exit(0)
		}

		http.HandleFunc("/api/record/"+name+"/List", func(w http.ResponseWriter, r *http.Request) {
			ListModelHandler(w, r, dataModel)
		})
		http.HandleFunc("/api/record/"+name+"/Get/", func(w http.ResponseWriter, r *http.Request) {
			GetModelHandler(w, r, dataModel, formModel)
		})
		http.HandleFunc("/api/record/"+name+"/Edit/", func(w http.ResponseWriter, r *http.Request) {
			EditModelHandler(w, r, dataModel, formModel)
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

func createFormModel(dataModel schema.DataModel) (FormModel, error) {
	var res FormModel
	var invalidFields []*schema.DataModelField
	for _, field := range dataModel.Fields {
		typeInfo, ok := datatype.Get(field.Type)
		if !ok {
			invalidFields = append(invalidFields, field)
			continue
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
	if err := schema.InvalidFieldsToError(invalidFields); err != nil {
		return FormModel{}, err
	}
	if len(res.Actions) == 0 {
		res.Actions = append(res.Actions, FormFieldModel{
			Type:  "Button",
			Name:  "Edit",
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

func ModelListModelHandler(w http.ResponseWriter, r *http.Request, dataModels []schema.DataModel) {
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

func GetModelHandler(w http.ResponseWriter, r *http.Request, dataModel schema.DataModel, formModel FormModel) {
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
	if newID == 0 {
		// New record
		res := RecordGetResponse{}
		res.FormModel = formModel
		res.Data = dataModel.NewRecord()
		jsonOutput, err := json.Marshal(&res)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Write(jsonOutput)
		return
	}
	path := "assets/.db/" + dataModel.Name + "/" + strconv.FormatUint(newID, 10) + ".json"
	bytes, err := ioutil.ReadFile(path)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	var data schema.Record
	err = json.Unmarshal(bytes, &data)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	res := RecordGetResponse{}
	res.FormModel = formModel
	res.Data = data
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func ListModelHandler(w http.ResponseWriter, r *http.Request, dataModel schema.DataModel) {
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

	// Load all records
	list := make([]schema.Record, 0)
	dir := "assets/.db/" + dataModel.Name
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		pathList := make([]string, 0, 100)
		err := filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
			if filepath.Ext(path) == ".json" {
				pathList = append(pathList, path)
			}
			return err
		})
		if err != nil {
			http.Error(w, "Error loading list of records from directory: "+err.Error(), 500)
			return
		}
		// Sort alphabetically
		sort.Slice(pathList[:], func(i, j int) bool {
			return pathList[i] < pathList[j]
		})
		for _, path := range pathList {
			data, err := ioutil.ReadFile(path)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			var res schema.Record
			err = json.Unmarshal(data, &res)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			list = append(list, res)
		}
	}

	res := RecordListResponse{}
	res.DataModel = dataModel
	res.Data = list
	jsonOutput, err := json.Marshal(&res)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Write(jsonOutput)
}

func EditModelHandler(w http.ResponseWriter, r *http.Request, dataModel schema.DataModel, formModel FormModel) {
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
	record := make(map[string]interface{})
	err := json.NewDecoder(r.Body).Decode(&record)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	// Validate data against schema
	{
		var invalidFields []string
		for name, _ := range record {
			if !dataModel.HasFieldByName(name) {
				invalidFields = append(invalidFields, name)
				continue
			}
		}
		if len(invalidFields) > 0 {
			fieldStr := ""
			for _, name := range invalidFields {
				fieldStr += "- " + name + "\n"
			}
			http.Error(w, "Fields do not exist on \""+dataModel.Name+"\":\n"+fieldStr, 400)
			return
		}
	}

	// Get save directory
	dir := "assets/.db/" + dataModel.Name
	_, err = os.Stat(dir)
	dirExists := !os.IsNotExist(err)

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
			err = filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
				if filepath.Ext(path) == ".json" {
					idString := filepath.Base(path)
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

	res := RecordSaveResponse{}
	res.Data = record
	res.Data["ID"] = newID
	if title, _ := res.Data["Title"]; title == "" {
		// Set default Title (testing that values can come from the server)
		res.Data["Title"] = "New Page Title"
	}
	res.Errors = make(map[string]string)
	{
		if !dirExists {
			os.MkdirAll(dir, 0700)
		}
		// Write file
		file, _ := json.MarshalIndent(res.Data, "", "	")
		idString := strconv.FormatUint(newID, 10)
		if err := ioutil.WriteFile("assets/.db/"+dataModel.Name+"/"+idString+".json", file, 0644); err != nil {
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

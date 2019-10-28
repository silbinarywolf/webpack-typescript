package server

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/silbinarywolf/webpack-typescript/server/internal/schema"
)

var (
	indexHtml []byte
)

type FormModel struct {
	Fields  []FieldModel `json:"fields"`
	Actions []FieldModel `json:"actions"`
}

type FieldModel struct {
	Type  string `json:"type"`
	Name  string `json:"name"`
	Label string `json:"label"`
}

type RecordGetResponse struct {
	FormModel FormModel              `json:"formModel"`
	Data      map[string]interface{} `json:"data"`
}

type RecordSaveResponse struct {
	Data   map[string]interface{} `json:"data"`
	Errors map[string]string      `json:"errors"`
}

func Start() {
	schema.LoadAll()

	// TODO(Jake): 2019-10-27
	// Create system to watch files so that schema can be updated on the fly

	dataModels := schema.DataModels()
	for _, dataModel := range dataModels {
		name := dataModel.Name
		formModel, err := createFormModel(dataModel)
		if err != nil {
			// TODO(jake): 2019-10-27
			// make this error message nicer
			fmt.Printf("An error occurred building form model from data model: %s\n%s", name, err)
			os.Exit(0)
		}

		http.HandleFunc("/api/"+name+"/Get/", func(w http.ResponseWriter, r *http.Request) {
			GetModelHandler(w, r, dataModel, formModel)
		})
		http.HandleFunc("/api/"+name+"/Edit/", func(w http.ResponseWriter, r *http.Request) {
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

func createNewRecord(dataModel schema.DataModel) (map[string]interface{}, error) {
	var invalidFields []*schema.DataModelField
	data := make(map[string]interface{})
	for _, field := range dataModel.Fields {
		switch field.Type {
		case "String":
			data[field.Name] = ""
		case "Int64":
			data[field.Name] = ""
		default:
			invalidFields = append(invalidFields, field)
		}
	}
	if len(invalidFields) > 0 {
		errorMessage := "The following fields have an invalid type:\n"
		for _, field := range invalidFields {
			errorMessage += "- " + field.Name + ": \"" + field.Type + "\"\n"
		}
		// todo(Jake): 2019-10-27
		// Have system to register types and just print all available here
		errorMessage += "\nThe field types that are available are:\n"
		errorMessage += "- String"
		errorMessage += "- Int64"
		return nil, errors.New(errorMessage)
	}
	return data, nil
}

func createFormModel(dataModel schema.DataModel) (FormModel, error) {
	var res FormModel
	var invalidFields []*schema.DataModelField
	for _, field := range dataModel.Fields {
		switch field.Type {
		case "String":
			res.Fields = append(res.Fields, FieldModel{
				Type:  "TextField",
				Name:  field.Name,
				Label: field.Name,
			})
		case "Int64":
			res.Fields = append(res.Fields, FieldModel{
				Type: "HiddenField",
				Name: field.Name,
			})
		default:
			invalidFields = append(invalidFields, field)
		}
	}
	if len(invalidFields) > 0 {
		errorMessage := "The following fields have an invalid type:\n"
		for _, field := range invalidFields {
			errorMessage += "- " + field.Name + ": \"" + field.Type + "\"\n"
		}
		// todo(Jake): 2019-10-27
		// Have system to register types and just print all available here
		errorMessage += "\nThe field types that are available are:\n"
		errorMessage += "- String"
		errorMessage += "- Int64"
		return FormModel{}, errors.New(errorMessage)
	}
	if len(res.Actions) == 0 {
		res.Actions = append(res.Actions, FieldModel{
			Type:  "Button",
			Name:  "Edit",
			Label: "Save",
		})
	}
	return res, nil
}

func getId(path string) int64 {
	v := strings.Split(path, "/")
	if len(v) > 1 {
		if i, err := strconv.ParseInt(v[1], 10, 64); err == nil {
			return i
		} else {
			return 0
		}
	}
	return 0
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
	res := RecordGetResponse{}
	res.FormModel = formModel
	res.Data = dataModel.NewRecord()
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
	// Get next ID
	newID := getId(r.URL.Path)
	{
		err = filepath.Walk("assets/.db/"+dataModel.Name, func(path string, f os.FileInfo, err error) error {
			if filepath.Ext(path) == ".json" {
				idString := filepath.Base(path)
				idString = strings.TrimSuffix(idString, filepath.Ext(idString))
				id, err := strconv.ParseInt(idString, 10, 64)
				if err != nil {
					return err
				}
				if newID <= id {
					newID = id + 1
				}
			}
			return err
		})
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
	}

	res := RecordSaveResponse{}
	res.Data = record
	res.Data["ID"] = newID
	res.Errors = make(map[string]string)
	{
		// Write file
		file, _ := json.MarshalIndent(res.Data, "", "	")
		idString := strconv.FormatInt(newID, 16)
		if err := ioutil.WriteFile("assets/.db/Page/"+idString+".json", file, 0644); err != nil {
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

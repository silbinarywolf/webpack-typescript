package schema

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
)

const (
	reservedNameError = `
cannot define field using reserved name. Reserved names are:
- ID
`
)

var (
	modelMap  = make(map[string]*DataModel)
	modelList []DataModel
)

type DataModelField struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type DataModel struct {
	Name         string            `json:"name"`
	Fields       []*DataModelField `json:"fields"`
	fieldMap     map[string]*DataModelField
	newRecordMap map[string]interface{}
}

func (dataModel *DataModel) FieldByName(name string) (*DataModelField, bool) {
	r, ok := dataModel.fieldMap[name]
	return r, ok
}

func (dataModel *DataModel) HasFieldByName(name string) bool {
	_, ok := dataModel.fieldMap[name]
	return ok
}

// NewRecord will create a new map object based on the model of
// the data
func (dataModel *DataModel) NewRecord() map[string]interface{} {
	record := make(map[string]interface{})
	for name, value := range dataModel.newRecordMap {
		record[name] = value
	}
	return record
}

func LoadAll() {
	fileList := make([]string, 0)
	e := filepath.Walk("assets/.model", func(path string, f os.FileInfo, err error) error {
		if filepath.Ext(path) == ".json" {
			fileList = append(fileList, path)
		}
		return err
	})
	if e != nil {
		panic(e)
	}
	if len(fileList) == 0 {
		panic("No schema files found")
	}
	for _, path := range fileList {
		model, err := decodeAndValidateModel(path)
		if err != nil {
			panic(err)
		}
		model.Name = filepath.Base(path)
		model.Name = strings.TrimSuffix(model.Name, filepath.Ext(model.Name))
		if _, ok := modelMap[model.Name]; ok {
			panic("Cannot define same model twice: " + model.Name + ", " + path)
		}
		modelList = append(modelList, model)
		modelMap[model.Name] = &modelList[len(modelList)-1]
	}
}

func DataModels() []DataModel {
	return modelList
}

func decodeAndValidateModel(path string) (DataModel, error) {
	var emptyModel DataModel
	file, err := os.Open(path)
	defer file.Close()
	if err != nil {
		return emptyModel, err
	}
	// NOTE(Jake): 2019-10-27
	// Look into finding something that can:
	// - Parse JSON with comments
	// - Allow trailing commas.
	// Since these are config files, it'd be nice
	// if people can note down things in them and make
	// rapid changes (ie. add trailing commas without getting errors)
	var dataModel DataModel
	parser := json.NewDecoder(file)
	if err := parser.Decode(&dataModel); err != nil {
		return emptyModel, err
	}
	// Validate that there are no duplicates
	{
		fieldMap := make(map[string]*DataModelField)
		for _, field := range dataModel.Fields {
			if _, ok := fieldMap[field.Name]; ok {
				return emptyModel, errors.New(dataModel.Name + ": cannot define field on model twice.")
			}
			fieldMap[field.Name] = field
		}
		dataModel.fieldMap = fieldMap
	}
	// Add reserved fields
	{
		// NOTE(Jake): 2019-10-27
		// We may want a flag / array in the JSON files so that reserved
		// fields can ignored.
		var reservedFields []*DataModelField
		// Add ID
		{
			if dataModel.HasFieldByName("ID") {
				return emptyModel, errors.New(dataModel.Name + ": " + reservedNameError)
			}
			reservedField := &DataModelField{
				Name: "ID",
				Type: "Int64",
			}
			reservedFields = append(reservedFields, reservedField)
			dataModel.fieldMap[reservedField.Name] = reservedField
		}
		dataModel.Fields = append(reservedFields, dataModel.Fields...)
	}
	// Create default new record structure
	{
		var invalidFields []*DataModelField
		data := make(map[string]interface{})
		for _, field := range dataModel.Fields {
			switch field.Type {
			case "String":
				data[field.Name] = ""
			case "Int64":
				data[field.Name] = int64(0)
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
			return emptyModel, errors.New(errorMessage)
		}
		dataModel.newRecordMap = data
	}

	return dataModel, nil
}

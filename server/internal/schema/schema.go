package schema

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
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
	Name     string           `json:"name"`
	Fields   []DataModelField `json:"fields"`
	fieldMap map[string]*DataModelField
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

func (model *DataModel) FieldByName(name string) (*DataModelField, bool) {
	r, ok := model.fieldMap[name]
	return r, ok
}

func (model *DataModel) HasFieldByName(name string) bool {
	_, ok := model.fieldMap[name]
	return ok
}

func decodeAndValidateModel(path string) (DataModel, error) {
	var model DataModel
	file, err := os.Open(path)
	defer file.Close()
	if err != nil {
		return model, err
	}
	// NOTE(Jake): 2019-10-27
	// Look into finding something that can:
	// - Parse JSON with comments
	// - Allow trailing commas.
	// Since these are config files, it'd be nice
	// if people can note down things in them and make
	// rapid changes.
	parser := json.NewDecoder(file)
	if err := parser.Decode(&model); err != nil {
		return model, err
	}
	// Validate that there are no duplicates
	{
		fieldMap := make(map[string]*DataModelField)
		for i := 0; i < len(model.Fields); i++ {
			field := &model.Fields[i]
			if _, ok := fieldMap[field.Name]; ok {
				return model, errors.New(model.Name + ": cannot define field on model twice.")
			}
			fieldMap[field.Name] = field
		}
		model.fieldMap = fieldMap
	}
	return model, nil
}

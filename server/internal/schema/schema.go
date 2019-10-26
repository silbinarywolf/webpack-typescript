package schema

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
)

var (
	modelMap  = make(map[string]*Model)
	modelList []Model
)

type ModelField struct {
	Name string `json:"Name"`
	Kind string `json:"Kind"`
}

type Model struct {
	Name   string       `json:"Name"`
	Fields []ModelField `json:"Fields"`
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
		model, err := decodeModel(path)
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

func Models() []Model {
	return modelList
}

func decodeModel(path string) (Model, error) {
	file, err := os.Open(path)
	defer file.Close()
	if err != nil {
		return Model{}, err
	}
	var m Model
	parser := json.NewDecoder(file)
	if err := parser.Decode(&m); err != nil {
		return Model{}, err
	}
	return m, nil
}

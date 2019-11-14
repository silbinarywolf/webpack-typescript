package schema

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"

	dynamicstruct "github.com/Ompluscator/dynamic-struct"
	"github.com/silbinarywolf/webpack-typescript/server/internal/datatype"
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
	hasLoaded bool
)

type DataModelField struct {
	Name string `json:"name"`
	Type string `json:"type"`
	/**
	 * Readonly field can only be written when the record is
	 * inserted. This is used by unique IDs or created time fields.
	 */
	Readonly bool `json:"readonly"`
}

type DataModel struct {
	// todo(Jake): 2019-11-14
	// change json:name to something else.  What we really
	// need is like API name for the frontend, which might not
	// necessarily be the table name.
	Table    string            `json:"name"`
	Fields   []*DataModelField `json:"fields"`
	typeInfo dynamicstruct.DynamicStruct
	fieldMap map[string]*DataModelField
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
func (dataModel *DataModel) NewRecord() interface{} {
	return dataModel.typeInfo.New()
}

func (dataModel *DataModel) NewSliceOfRecords() interface{} {
	return dataModel.typeInfo.NewSliceOfStructs()
}

func LoadAll() {
	if hasLoaded {
		panic("Cannot call LoadAll() more than once.")
	}
	hasLoaded = true

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
		model.Table = filepath.Base(path)
		model.Table = strings.TrimSuffix(model.Table, filepath.Ext(model.Table))
		model.Table = strings.ToLower(model.Table)
		if _, ok := modelMap[model.Table]; ok {
			panic("Cannot define same model twice: " + model.Table + ", " + path + "\n\nModel names are case-insensitive")
		}
		modelList = append(modelList, model)
		modelMap[model.Table] = &modelList[len(modelList)-1]
	}
}

func DataModels() []DataModel {
	if !hasLoaded {
		panic("Must call LoadAll() first.")
	}
	return modelList
}

func createNewRecord(dataModel DataModel) (map[string]interface{}, error) {
	var invalidFields []*DataModelField
	data := make(map[string]interface{})
	for _, field := range dataModel.Fields {
		typeInfo, ok := datatype.Get(field.Type)
		if !ok {
			invalidFields = append(invalidFields, field)
			continue
		}
		data[field.Name] = typeInfo.ZeroValue()
	}
	if err := InvalidFieldsToError(invalidFields); err != nil {
		return nil, err
	}
	return data, nil
}

func InvalidFieldsToError(invalidFields []*DataModelField) error {
	if len(invalidFields) == 0 {
		return nil
	}
	errorMessage := "The following fields have an invalid type:\n"
	for _, field := range invalidFields {
		errorMessage += "- " + field.Name + ": \"" + field.Type + "\""
		if field.Type == "" {
			errorMessage += " (left blank or not set in JSON)"
		}
		errorMessage += "\n"
	}
	errorMessage += "\nThe field types that are available are:\n- " + strings.Join(datatype.List(), "\n- ")
	return errors.New(errorMessage)
}

func decodeAndValidateModel(filename string) (DataModel, error) {
	var emptyModel DataModel
	file, err := os.Open(filename)
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
	table := dataModel.Table
	// Validate model name
	{
		if table != "" {
			return emptyModel, errors.New(table + ": Must omit \"Name\" field. This is inferred from the filename")
		}
	}
	// Validate that there are no duplicates
	{
		fieldMap := make(map[string]*DataModelField)
		for _, field := range dataModel.Fields {
			if _, ok := fieldMap[field.Name]; ok {
				return emptyModel, errors.New(table + ": cannot define field on model twice.")
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
				return emptyModel, errors.New(table + ": " + reservedNameError)
			}
			reservedField := &DataModelField{
				Name:     "ID",
				Type:     datatype.Uint64,
				Readonly: true,
			}
			reservedFields = append(reservedFields, reservedField)
			dataModel.fieldMap[reservedField.Name] = reservedField
		}

		dataModel.Fields = append(reservedFields, dataModel.Fields...)
	}
	// Build struct type
	{
		var invalidFields []*DataModelField
		structType := dynamicstruct.NewStruct()
		for _, field := range dataModel.Fields {
			typeInfo, ok := datatype.Get(field.Type)
			if !ok {
				invalidFields = append(invalidFields, field)
				continue
			}
			structType.AddField(field.Name, typeInfo.ZeroValue(), `json:"`+field.Name+`"`)
		}
		if err := InvalidFieldsToError(invalidFields); err != nil {
			return emptyModel, err
		}
		dataModel.typeInfo = structType.Build()
	}

	return dataModel, nil
}

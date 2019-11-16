package schema

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	dynamicstruct "github.com/Ompluscator/dynamic-struct"
	"github.com/silbinarywolf/webpack-typescript/server/internal/assetdir"
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
	modelList []*DataModel
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

func (dataModel *DataModel) Identifier() string {
	return dataModel.Table
}

func (dataModel *DataModel) FormFieldModel() string {
	return "TextField"
}

func (dataModel *DataModel) ZeroValue() interface{} {
	return uint64(0)
}

func LoadAll() error {
	if hasLoaded {
		panic("Cannot call LoadAll() more than once.")
	}
	hasLoaded = true

	dir := assetdir.ModelDir()
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		dir, _ := filepath.Abs(assetdir.ModelDir())
		return errors.New("Expected folder to exist: " + dir + "\n\nAlternatively, you can point at a different directory with the -" + assetdir.AssetFlag + " flag")
	}

	fileList := make([]string, 0)
	e := filepath.Walk(dir, func(path string, f os.FileInfo, err error) error {
		if filepath.Ext(path) == ".json" {
			fileList = append(fileList, path)
		}
		return err
	})
	if e != nil {
		panic(e)
	}
	if len(fileList) == 0 {
		return errors.New("No model definitions found in: " + dir)
	}
	for _, path := range fileList {
		model, err := decodeModel(path)
		if err != nil {
			return err
		}
		model.Table = filepath.Base(path)
		model.Table = strings.TrimSuffix(model.Table, filepath.Ext(model.Table))
		model.Table = strings.ToLower(model.Table)
		if _, ok := modelMap[model.Table]; ok {
			return errors.New("Cannot define same model twice: " + model.Table + ", " + path + "\n\nModel names are case-insensitive")
		}
		modelList = append(modelList, &model)
		modelMap[model.Table] = modelList[len(modelList)-1]
	}
	// Add models to type info
	for _, model := range modelList {
		if !datatype.CanRegister(model) {
			return errors.New("Cannot register model as it conflicts with an existing type name: " + model.Table)
		}
		datatype.Register(model)
	}
	for _, model := range modelList {
		if err := initAndTypecheckDataModelFields(model); err != nil {
			return err
		}
	}
	return nil
}

func DataModels() []*DataModel {
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
	errorMessage := "These fields have an invalid type:\n"
	for _, field := range invalidFields {
		errorMessage += "- " + field.Name + ": \"" + field.Type + "\""
		if field.Type == "" {
			errorMessage += " (left blank or not set in JSON)"
		}
		errorMessage += "\n"
	}
	errorMessage += "\nThe types that are available are:\n- " + strings.Join(datatype.List(), "\n- ")
	return errors.New(errorMessage)
}

func decodeModel(filename string) (DataModel, error) {
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
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&dataModel); err != nil {
		return emptyModel, fmt.Errorf("Error loading model: %s\n%v", filename, err)
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

	return dataModel, nil
}

func initAndTypecheckDataModelFields(dataModel *DataModel) error {
	if dataModel.typeInfo != nil {
		panic("Should not call this method more than once on dataModel")
	}
	// Build struct type
	var invalidFields bytes.Buffer
	hasMissingTypes := false
	structType := dynamicstruct.NewStruct()
	for _, field := range dataModel.Fields {
		typeInfo, ok := datatype.Get(field.Type)
		if !ok {
			invalidFields.WriteString("- " + field.Name + ": \"" + field.Type + "\" type does not exist.")
			if field.Type == "" {
				invalidFields.WriteString(" (left blank or not set in file)")
			}
			invalidFields.WriteString("\n")
			hasMissingTypes = true
			continue
		}
		if typeInfo.Identifier() == dataModel.Identifier() {
			// Cannot reference self unless its a pointer
			invalidFields.WriteString("- " + field.Name + ": \"" + field.Type + "\" cannot reference itself unless its a pointer, ie. \"*" + field.Type + "\"")
			continue
		}
		structType.AddField(field.Name, typeInfo.ZeroValue(), `json:"`+field.Name+`"`)
	}
	// Show errors
	if invalidFields.Len() > 0 {
		if hasMissingTypes {
			invalidFields.WriteString("\nThe types that are available are:\n- " + strings.Join(datatype.List(), "\n- "))
		}
		return errors.New("Errors:\n" + invalidFields.String())
	}
	dataModel.typeInfo = structType.Build()
	return nil
}

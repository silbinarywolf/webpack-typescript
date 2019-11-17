package datatype

import (
	"sort"
	"unicode/utf8"
)

type dataTypeInterface interface {
	Identifier() string
	FormFieldModel() string
	ZeroValue() interface{}
}

type dataTypeComplex interface {
	dataTypeInterface
	IsPointer() bool
}

type dataTypeGet struct {
	dataTypeInterface
	isPointer bool
}

func (dataType *dataTypeGet) Identifier() string {
	return dataType.dataTypeInterface.Identifier()
}

func (dataType *dataTypeGet) FormFieldModel() string {
	return dataType.dataTypeInterface.FormFieldModel()
}

func (dataType *dataTypeGet) ZeroValue() interface{} {
	return dataType.dataTypeInterface.ZeroValue()
}

func (dataType *dataTypeGet) IsPointer() bool {
	return dataType.isPointer
}

var (
	dataTypes             []dataTypeInterface
	dataTypesByIdentifier map[string]dataTypeInterface = make(map[string]dataTypeInterface)
)

func CanRegister(dataType dataTypeInterface) bool {
	ident := dataType.Identifier()
	if ident == "" {
		return false
	}
	if _, ok := dataTypesByIdentifier[ident]; ok {
		return false
	}
	return true
}

func Register(dataType dataTypeInterface) {
	ident := dataType.Identifier()
	if ident == "" {
		panic("Cannot register data type with Identifier() that returns an empty string")
	}
	if _, ok := dataTypesByIdentifier[ident]; ok {
		panic("Cannot register same data type more than once: " + ident)
	}
	dataTypesByIdentifier[ident] = dataType
	dataTypes = append(dataTypes, dataType)
}

/*func errorCheck(dataType dataTypeInterface) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = r
		}
	}()
	dataType.ZeroValue()
}*/

func Get(identifier string) (dataTypeComplex, bool) {
	isPointer := false
	runeValue, width := utf8.DecodeRuneInString(identifier[0:])
	if runeValue == '*' {
		identifier = identifier[width:]
		isPointer = true
	}
	dataType, ok := dataTypesByIdentifier[identifier]
	if !ok {
		return nil, false
	}
	return &dataTypeGet{
		dataTypeInterface: dataType,
		isPointer:         isPointer,
	}, true
}

func List() []string {
	list := make([]string, 0, len(dataTypes))
	for _, dataType := range dataTypes {
		list = append(list, dataType.Identifier())
	}
	sort.Slice(list[:], func(i, j int) bool {
		// sort alphabetically
		return list[i] < list[j]
	})
	return list
}

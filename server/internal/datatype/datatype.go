package datatype

import (
	"sort"
)

type dataTypeInterface interface {
	Identifier() string
	FormFieldModel() string
	ZeroValue() interface{}
}

var (
	dataTypes []dataTypeInterface
	dataTypesByIdentifier map[string]dataTypeInterface = make(map[string]dataTypeInterface)
)

func Register(dataType dataTypeInterface) {
	ident := dataType.Identifier()
	if ident == "" {
		panic("Cannot register data type with Identifier() that returns an empty string")
	}
	dataTypesByIdentifier[ident] = dataType
	dataTypes = append(dataTypes, dataType)
}

func Get(identifier string) (dataTypeInterface, bool) {
	result, ok := dataTypesByIdentifier[identifier]
	if !ok {
		return nil, false
	}
	return result, true
}

func List() []string {
	list := make([]string, 0, len(dataTypes))
	for _, dataType := range dataTypes {
		list = append(list, dataType.Identifier())
	}
	sort.Slice(list[:], func(i, j int) bool {
		return list[i] < list[j]
	})
	return list
}
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

func Get(identifier string) (dataTypeInterface, bool) {
	/*runeValue, width := utf8.DecodeRuneInString(identifier[0:])
	if runeValue == '*' {
		identifier = identifier[width:]
	}*/
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
		// sort alphabetically
		return list[i] < list[j]
	})
	return list
}

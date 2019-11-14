package datatype

const String = "string"

type stringFieldType struct{}

func init() {
	Register(stringFieldType{})
}

func (fieldType stringFieldType) Identifier() string {
	return String
}

func (fieldType stringFieldType) FormFieldModel() string {
	return "TextField"
}

func (fieldType stringFieldType) ZeroValue() interface{} {
	return ""
}

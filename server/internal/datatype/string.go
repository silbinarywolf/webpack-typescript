package datatype

type stringFieldType struct {}

func init() {
	Register(stringFieldType{})
}

func (fieldType stringFieldType) Identifier() string {
	return "string"
}

func (fieldType stringFieldType) FormFieldModel() string {
	return "TextField"
}

func (fieldType stringFieldType) ZeroValue() interface{} {
	return ""
}

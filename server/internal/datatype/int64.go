package datatype

type int64FieldType struct {}

func init() {
	Register(int64FieldType{})
}

func (fieldType int64FieldType) Identifier() string {
	return "int64"
}

func (fieldType int64FieldType) FormFieldModel() string {
	return "TextField"
}

func (fieldType int64FieldType) ZeroValue() interface{} {
	return int64(0)
}

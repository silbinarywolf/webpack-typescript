package datatype

const Int64 = "int64"

type int64FieldType struct{}

func init() {
	Register(int64FieldType{})
}

func (fieldType int64FieldType) Identifier() string {
	return Int64
}

func (fieldType int64FieldType) FormFieldModel() string {
	return "TextField"
}

func (fieldType int64FieldType) ZeroValue() interface{} {
	return int64(0)
}

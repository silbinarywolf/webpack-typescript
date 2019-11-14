package datatype

const Uint64 = "uint64"

type uint64FieldType struct{}

func init() {
	Register(uint64FieldType{})
}

func (fieldType uint64FieldType) Identifier() string {
	return Uint64
}

func (fieldType uint64FieldType) FormFieldModel() string {
	return "TextField"
}

func (fieldType uint64FieldType) ZeroValue() interface{} {
	return uint64(0)
}

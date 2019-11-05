export interface DataModelField {
	name: string
	type: string
}

export interface DataModel {
	name: string
	fields: DataModelField[]
}

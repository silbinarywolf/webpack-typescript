export namespace models {
	export interface FormRecord {
		[fieldName: string]: string | number | FormRecord;
		ID: number;
	}

	export interface DataModelField {
		name: string
		type: string
	}

	export interface DataModel {
		name: string
		fields: DataModelField[]
	}

	export interface FormModel {
		fields: FormFieldModel[];
		actions: FormFieldModel[];
	}

	export interface FormFieldModel {
		type: string;
		name: string;
		label: string;
		children: FormFieldModel[];
	}
}

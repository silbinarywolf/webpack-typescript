import React from "react";

import { models } from "client/models";
import { FormField } from "client/form/FormField/FormField";
import { TextField } from "client/form/TextField/TextField";
import { HiddenField } from "client/form/HiddenField/HiddenField";
import { SelectField } from "client/form/SelectField/SelectField";

interface State {
}

interface Props extends FormField {
	recordModel: string;
	recordId: number;
	records: { [modelName: string]: { [id: number ]: models.FormRecord } }
	formModels: { [modelName: string]: models.FormModel }
	disabled?: boolean;

	record?: models.FormRecord;
	//onChange: (record: models.FormRecord | undefined) => void;
}

export class RecordField extends React.Component<Props, State> {
	Record(): models.FormRecord | undefined {
		const id = this.props.recordId;
		const modelName = this.props.recordModel;
		const recordMap = this.props.records[modelName];
		if (recordMap === undefined) {
			return;
		}
		const formModel = this.props.formModels[modelName];
		if (formModel === undefined) {
			return;
		}
		const record = recordMap[id];
		if (record === undefined) {
			return;
		}
		return record;
	}

	onChangeField = (fieldName: string, value: any): void => {
		const record = this.Record()
		if (record === undefined) {
			return;
		}
		record[fieldName] = value
		this.setState({
			record: record,
		})
		console.warn('onChangeField', this.props.records)
	}

	renderFields = (): JSX.Element | undefined => {
		// rootRecord: models.FormRecord, record: models.FormRecord, fields: models.FormFieldModel[], disabled: boolean, onRecordChange: (record: models.FormRecord | undefined) => void, onSubmit: (actionName: string) => void
		const formModel = this.props.formModels[this.props.recordModel];
		if (formModel === undefined) {
			return;
		}
		const record = this.Record()
		if (record === undefined) {
			return;
		}
		const {
			disabled
		} = this.props;
		let renderedFields: JSX.Element[] = [];
		let namesTaken: {[name: string]: boolean} = {};
		console.warn('renderFields', record)
		for (let field of formModel.fields) {
			const {
				type,
				label,
				name,
			} = field;
			if (namesTaken[name] === true) {
				throw new Error(`Field "${name}" cannot be defined twice.`);
			}
			namesTaken[name] = true;
			const value = record[name];
			// todo(Jake): 2019-10-26
			// Use system to register new field types
			// possibly lazy load
			switch (type) {
			case "TextField":
				if (typeof value === 'object') {
					throw new Error("Unexpected error on property \""+name+"\". Expected string or number not " + typeof value);
				}
				renderedFields.push(
					<TextField
						key={name}
						label={label}
						name={name}
						value={value}
						disabled={disabled}
						onChange={(value) => this.onChangeField(name, value)}
					/>
				);
			break;

			case "SelectField":
				if (typeof value === 'object') {
					throw new Error("Unexpected error on property \""+name+"\". Expected string or number not " + typeof value);
				}
				renderedFields.push(
					<SelectField
						key={name}
						label={label}
						name={name}
						value={value}
						disabled={disabled}
						onChange={(value) => this.onChangeField(name, value)}
					/>
				);
			break;

			case "RecordField": {
				/*if (typeof value !== 'object') {
					throw new Error("Unexpected error on property \""+name+"\". Expected object not " + typeof value);
				}*/
				if (typeof value !== 'number') {
					throw new Error("Unexpected error on property \""+name+"\". Expected number (for record id) not " + typeof value);
				}
				const {
					model
				} = field;
				renderedFields.push(
					<RecordField
						key={name}
						name={name}
						label={label}
						disabled={disabled}
						recordId={value}
						recordModel={model}
						records={this.props.records}
						formModels={this.props.formModels}
						//onChange={(value) => this.onChangeField(name, value)}
					/>
				);
				break;
			}

			case "HiddenField":
				if (typeof value === 'object') {
					throw new Error("Unexpected error on property \""+name+"\". Expected string or number not " + typeof value);
				}
				renderedFields.push(
					<HiddenField
						key={name}
						name={name}
						value={value}
					/>
				);
			break;

			/*case "Button":
				renderedFields.push(
					<Button
						key={name}
						name={name}
						label={label}
						type="submit"
						disabled={disabled}
						onClick={() => onSubmit(name)}
					/>
				);
			break;*/

			case undefined:
				throw new Error(`${name}: Field model "type" property is missing.`);
			break;

			default:
				throw new Error(`${name}: Field model type "${type}" does not exist.`);
			break;
			}
		}
		return <React.Fragment children={renderedFields}/>;
	}

	/*onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const {
			onChange
		} = this.props;
		onChange(e.target.value);
	}*/

	render(): JSX.Element {
		const {
			label,
			children,
		} = this.props
		return (
			<fieldset>
				{label !== "" &&
					<legend>{label}</legend>
				}
    			<React.Fragment>
					{this.renderFields()}
				</React.Fragment>
    			{children}
    		</fieldset>
		)
	}
}

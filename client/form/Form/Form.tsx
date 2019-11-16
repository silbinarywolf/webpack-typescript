import React from "react";

import { models } from "client/models";
import { TextField } from "client/form/TextField/TextField";
import { RecordField } from "client/form/RecordField/RecordField";
import { HiddenField } from "client/form/HiddenField/HiddenField";
import { Button } from "client/form/Button/Button";

interface Props {
	id: string;
	record: models.FormRecord | undefined;
	error: string;
	model: models.FormModel;
	disabled?: boolean;
	onRecordChange: (record: models.FormRecord | undefined) => void;
	onSubmit: (actionName: string) => void;
}

function onChangeField(rootRecord: models.FormRecord, record: models.FormRecord, name: string, value: string | number, onRecordChange: (record: models.FormRecord | undefined) => void): void {
	const oldValue = record[name];
	if (value === oldValue) {
		// do nothing if no real value change
		return;
	}

	// NOTE(Jake): 2019-11-16
	// Maybe we need to generate a new object at this level too?
	// So that things are properly immutable.
	record[name] = value;

	// Force new object creation at root so re-render can occur
	rootRecord = {
		...rootRecord,
	};
	onRecordChange(rootRecord)
}

function renderFields(rootRecord: models.FormRecord, record: models.FormRecord, fields: models.FormFieldModel[], disabled: boolean, onRecordChange: (record: models.FormRecord | undefined) => void, onSubmit: (actionName: string) => void): JSX.Element {
	let renderedFields: JSX.Element[] = [];
	let namesTaken: {[name: string]: boolean} = {};
	for (let field of fields) {
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
					onChange={(value) => onChangeField(rootRecord, record, name, value, onRecordChange)}
				/>
			);
		break;

		case "RecordField": {
			if (typeof value !== 'object') {
				throw new Error("Unexpected error on property \""+name+"\". Expected object not " + typeof value);
			}
			renderedFields.push(
				<RecordField
					key={name}
					name={name}
					label={label}
					value={value}
					disabled={disabled}
					onChange={(value) => onChangeField(rootRecord, record, name, value, onRecordChange)}
				>
					{renderFields(rootRecord, value, field.children, disabled, onRecordChange, onSubmit)}
				</RecordField>
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

		case "Button":
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
		break;

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

export function Form(props: Props): JSX.Element {
	const onSubmitButton = (actionName: string): void => {
		props.onSubmit(actionName)
	}

	/*const renderActions = (): JSX.Element => {
		const {
			model,
			disabled,
		} = props;
		let componentsToRender: JSX.Element[] = [];
		let namesTaken: {[name: string]: boolean} = {};
		for (let action of model.actions) {
			const {
				name,
				type,
				label,
			} = action;
			if (namesTaken[name] === true) {
				throw new Error(`Action "${name}" cannot be defined twice.`);
			}
			namesTaken[name] = true;
			// todo(Jake): 2019-10-26
			// Use system to register new action types
			// possibly lazy load
			switch (type) {
				case "Button":
					componentsToRender.push(
						<Button
							key={name}
							type="submit"
							label={label}
							disabled={disabled}
							onClick={() => onSubmitButton(name)}
						/>
					);
				break;

				case undefined:
					throw new Error(`${name}: Field model "type" property is missing.`);
				break;

				default:
					throw new Error(`${name}: Field model type "${type}" does not exist.`);
				break;
			}
		}
		return (
			<React.Fragment
				children={componentsToRender}
			/>
		);
	}*/

	const {
		id,
		error,
		record,
		model,
		disabled,
		onRecordChange,
	} = props;
	const errorId = id + '_error';
	return (
		<form
			id={id}
			aria-describedby={errorId}
		>
			{error !== "" &&
				<p id={errorId}>
					{error}
				</p>
			}
			<React.Fragment>
				{record !== undefined
					? renderFields(record, record, model.fields, disabled === true, onRecordChange, onSubmitButton)
					: <div>No record</div>
				}
			</React.Fragment>
			<React.Fragment>
				{record !== undefined
					? renderFields(record, record, model.actions, disabled === true, onRecordChange, onSubmitButton)
					: <div>No record</div>
				}
			</React.Fragment>
		</form>
	)
}

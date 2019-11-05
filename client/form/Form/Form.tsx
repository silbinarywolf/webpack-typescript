import React from "react";

import { TextField } from "client/form/TextField/TextField";
import { HiddenField } from "client/form/HiddenField/HiddenField";
import { Button } from "client/form/Button/Button";

export interface FieldModel {
	/**
	 * Registered name of the type, usually the class name
	 * of the field
	 */
	type: string;
	name: string,
	label: string,
}

export interface FormModel {
	fields: FieldModel[];
	actions: FieldModel[];
}

export type FormRecord = {[fieldName: string]: string | number};

interface Props {
	id: string;
	record: FormRecord | undefined;
	error: string;
	model: FormModel;
	disabled?: boolean;
	onRecordChange: (record: FormRecord | undefined) => void;
	onSubmit: (actionName: string) => void;
}

export function Form(props: Props): JSX.Element {
	const onChangeField = (name: string, value: string): void => {
		let record = props.record;
		if (record === undefined) {
			return;
		}
		const oldValue = record[name];
		if (value === oldValue) {
			return;
		}
		const newRecord = {
			...record,
			[name]: value,
		}
		props.onRecordChange(newRecord)
	}

	const onSubmitButton = (actionName: string): void => {
		props.onSubmit(actionName)
	}

	const renderFields = (): JSX.Element => {
		const {
			record,
			model,
			disabled,
		} = props;
		let fields: JSX.Element[] = [];
		let namesTaken: {[name: string]: boolean} = {};
		for (let field of model.fields) {
			const {
				type,
				name,
				label,
			} = field;
			if (namesTaken[name] === true) {
				throw new Error(`Field "${name}" cannot be defined twice.`);
			}
			namesTaken[name] = true;
			let value = "";
			if (record && record[name]) {
				value = String(record[name]);
			}
			// todo(Jake): 2019-10-26
			// Use system to register new field types
			// possibly lazy load
			switch (type) {
				case "TextField":
					fields.push(
						<TextField
							key={name}
							name={name}
							label={label}
							value={value}
							disabled={disabled}
							onChange={(value) => onChangeField(name, value)}
						/>
					);
				break;

				case "HiddenField":
					fields.push(
						<HiddenField
							key={name}
							name={name}
							value={value}
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
		return <React.Fragment children={fields}/>;
	}

	const renderActions = (): JSX.Element => {
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
		return <React.Fragment children={componentsToRender}/>;
	}

	const {
		id,
		error,
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
				{renderFields()}
			</React.Fragment>
			<React.Fragment>
				{renderActions()}
			</React.Fragment>
		</form>
	)
}

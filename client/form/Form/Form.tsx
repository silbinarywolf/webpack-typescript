import React from "react";

import { TextField } from "client/form/TextField/TextField";
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

export type FormRecord = {[fieldName: string]: string | number} | undefined;

interface State {
}

interface Props {
	id: string;
	record: FormRecord;
	error: string;
	model: FormModel;
	disabled?: boolean;
	onUpdateRecord: (record: FormRecord) => void;
	onSubmit: (actionName: string) => void;
}

export class Form extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	onChangeField(name: string, value: string) {
		let record = this.props.record;
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
		this.props.onUpdateRecord(newRecord)
	}

	onSubmitButton = (actionName: string): void => {
		this.props.onSubmit(actionName)
	}

	renderFields = (): JSX.Element => {
		const {
			record,
			model,
			disabled,
		} = this.props;
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
							onChange={(value) => this.onChangeField(name, value)}
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

	renderActions = (): JSX.Element => {
		const {
			model,
			disabled,
		} = this.props;
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
							onClick={() => this.onSubmitButton(name)}
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

	render(): JSX.Element {
		const {
			id,
			error,
		} = this.props;
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
					{this.renderFields()}
				</React.Fragment>
				<React.Fragment>
					{this.renderActions()}
				</React.Fragment>
			</form>
		)
	}
}

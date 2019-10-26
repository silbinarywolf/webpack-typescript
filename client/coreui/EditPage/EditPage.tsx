import React from "react";

import { TextField } from "client/form/TextField/TextField.tsx";

import styles from "client/coreui/EditPage/EditPage.css";

const formSchema = {
	form: {},
	fields: [
		{
			type: "TextField",
			name: "Title",
			label: "Page Title",
		},
	],
};

interface State {
	record: {[fieldName: string]: string | number};
}

interface Props {
}

export default class EditPage extends React.Component<Props, State> {
	state: State = {
		record: {},
	};

	onChangeField(name: string, value: string) {
		this.setState(prevState => ({
		    record: {
		        ...prevState.record,
		        [name]: value
		    }
		}))
	}

	renderFields = (): JSX.Element => {
		const {
			record,
		} = this.state;
		let fields: JSX.Element[] = [];
		for (let field of formSchema.fields) {
			const {
				name,
				label,
			} = field;
			// todo(Jake): 2019-10-26
			// Use system to register new field types
			// possibly lazy load
			switch (field.type) {
				case "TextField":
					let value = '';
					if (record[name]) {
						value = String(value);
					}
					fields.push(
						<TextField
							{...field}
							value={value}
							onChange={(value) => this.onChangeField(name, value)}
						/>
					);
				break;
			}
		}
		return <React.Fragment children={fields}/>;
	}

	render(): JSX.Element {
		return (
			<React.Fragment>
				<form>
					{this.renderFields()}
				</form>
			</React.Fragment>
		)
	}
}

import React from "react";

import {
	Form,
	FormModel,
	FormRecord,
} from "client/form/Form/Form";
import { Fetch } from "client/fetch/Fetch/Fetch";

const formModel: FormModel = {
	fields: [
		{
			type: "TextField",
			name: "Title",
			label: "Page Title",
		},
		{
			type: "TextField",
			name: "Content",
			label: "Content",
		},
		{
			type: "TextField",
			name: "Name",
			label: "Persons Name",
		},
	],
	actions: [
		{
			type: "Button",
			name: "Edit",
			label: "Save",
		}
	]
};

interface State {
	isSubmitting: boolean;
	error: string;
	record: FormRecord;
}

interface Props {
}

export default class EditPage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			isSubmitting: false,
			error: '',
			record: {},
		}
	}

	onUpdateRecord = (record: FormRecord): void => {
		this.setState({
			record: record,
		})
	}

	onSubmit = (actionName: string): void => {
		this.setState({
			error: '',
			isSubmitting: true,
		})
		this.saveRecord(actionName)
		.catch((e) => {
			this.setState({
				error: String(e),
			})
		})
		.finally(() => {
			this.setState({
				isSubmitting: false,
			});
		});
	}

	async saveRecord(actionName: string) {
		if (actionName === '') {
			throw new Error('Cannot submit with blank actionName.');
		}
		const id = 0;
		let result = '';
		try {
			result = await Fetch.postJSON<string>("/api/Page/" + actionName + "/" + String(id), this.state.record);
		} catch (e) {
			throw e;
		}
		console.log('saveRecord', result);
	}

	render(): JSX.Element {
		const {
			record,
			error,
		} = this.state;
		return (
			<React.Fragment>
				<Form
					id="EditPageForm"
					record={record}
					error={error}
					model={formModel}
					onUpdateRecord={this.onUpdateRecord}
					onSubmit={this.onSubmit}
				/>
			</React.Fragment>
		)
	}
}

import React from "react";

import {
	Form,
	FormModel,
	FormRecord,
} from "client/form/Form/Form";
import { Loading } from "client/coreui/Loading/Loading";
import { Fetch } from "client/fetch/Fetch/Fetch";

interface State {
	isSubmitting: boolean;
	error: string;
	record: FormRecord;
	model: FormModel | undefined;
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
			model: undefined,
		}
	}

	componentDidMount() {
		this.getRecord();
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

	async getRecord() {
		const id = 0;
		let model: FormModel;
		try {
			model = await Fetch.getJSON<FormModel>("/api/Page/Get/" + String(id));
		} catch (e) {
			throw e;
		}
		this.setState({
			model: model,
		});
	}

	async saveRecord(actionName: string) {
		if (actionName === '') {
			throw new Error('Cannot submit with blank actionName.');
		}
		interface ModelResponse {
			data: FormRecord;
			errors: {[name: string]: string};
		}
		const id = 0;
		let res: ModelResponse;
		try {
			res = await Fetch.postJSON<ModelResponse>("/api/Page/" + actionName + "/" + String(id), this.state.record);
		} catch (e) {
			throw e;
		}
		if (res.data !== undefined) {
			this.setState({
				record: res.data,
			});
		}
	}

	render(): JSX.Element {
		const {
			model,
			record,
			error,
			isSubmitting,
		} = this.state;
		return (
			<React.Fragment>
				{model === undefined &&
					<Loading/>
				}
				{model !== undefined &&
					<React.Fragment>
						<Form
							id="EditPageForm"
							record={record}
							error={error}
							model={model}
							onUpdateRecord={this.onUpdateRecord}
							onSubmit={this.onSubmit}
							disabled={isSubmitting}
						/>
						{isSubmitting &&
							<p>Saving...</p>
						}
					</React.Fragment>
				}
			</React.Fragment>
		)
	}
}

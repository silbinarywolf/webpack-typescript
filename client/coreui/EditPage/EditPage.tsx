import React from "react";

import {
	Form,
	FormModel,
	FormRecord,
} from "client/form/Form/Form";
import { Loading } from "client/coreui/Loading/Loading";
import { Fetch } from "client/fetch/Fetch/Fetch";

interface RecordGetResponse {
	formModel: FormModel
	data: FormRecord
}

interface State {
	isSubmitting: boolean;
	error: string;
	/**
	 * loadedRecord is the record when it's state
	 * was loaded from the API endpoint.
	 */
	loadedRecord: FormRecord;
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
			loadedRecord: undefined,
			record: undefined,
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
		this.setState({
			error: '',
		})
		const id = 0;
		let response: RecordGetResponse;
		try {
			response = await Fetch.getJSON("/api/Page/Get/" + String(id));
		} catch (e) {
			this.setState({
				error: String(e),
			});
			return;
		}
		this.setState({
			model: response.formModel,
			loadedRecord: response.data,
			record: response.data,
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
					<React.Fragment>
						{error !== "" &&
							<pre>{error}</pre>
						}
						{error === "" &&
							<Loading/>
						}
					</React.Fragment>
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

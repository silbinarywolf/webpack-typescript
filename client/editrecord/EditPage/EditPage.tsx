import React from "react";
import { RouteComponentProps } from "react-router";

import {
	Form,
	FormModel,
	FormRecord,
} from "client/form/Form/Form";
import { Loading } from "client/coreui/Loading/Loading";
import { Fetch } from "client/fetch/Fetch/Fetch";
import { EditPagePath } from "client/editrecord/EditPage/register";
import { generateURL } from "client/router/RouterController/RouterController";

interface RecordGetResponse {
	formModel: FormModel
	data: FormRecord
}

interface State {
	isSubmitting: boolean;
	error: string;
	/**generateURL
	 * loadedRecord is the record when it's state
	 * was loaded from the API endpoint.
	 */
	loadedRecord: FormRecord;
	record: FormRecord;
	model: FormModel | undefined;
	goToRoute: string;
}

interface Params {
	model: string;
	id: string;
}

interface Props extends RouteComponentProps<Params> {
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
			goToRoute: '',
		}
	}

	componentDidMount() {
		this.getRecord();
	}

	componentDidUpdate(prevProps: Props, prevState: State, snapshot: any) {
		throw new Error('Need to force state to reset for case where you navigate to /add/Page')
	}

	readonly onRecordChange = (record: FormRecord): void => {
		this.setState({
			record: record,
		})
	}

	readonly onSubmit = (actionName: string): void => {
		this.setState({
			error: '',
			isSubmitting: true,
		})
		this.saveRecord(actionName)
		.then((record) => {
			if (!record) {
				return;
			}
			const isNewRecord = this.state.record ? this.state.record["ID"] === 0 : false;
			console.warn(this.state.record, this.state.record ? this.state.record["ID"] : undefined);
			this.setState({
				isSubmitting: false,
				record: record,
			})
			if (isNewRecord) {
				this.props.history.push(generateURL(EditPagePath, {
					id: record["ID"],
					model: this.props.match.params.model,
				}));
			}
		})
		.catch((e) => {
			this.setState({
				isSubmitting: false,
				error: String(e),
			})
		})
	}

	async getRecord(): Promise<FormRecord> {
		this.setState({
			error: '',
		})
		const id = 0;
		let response: RecordGetResponse;
		try {
			response = await Fetch.getJSON("/api/Page/Get/:id", {
				id: id,
			});
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
		return response.data;
	}

	async saveRecord(actionName: string): Promise<FormRecord> {
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
			res = await Fetch.postJSON<ModelResponse>(
				"/api/Page/:actionName/:id", 
				{
					actionName: actionName,
					id: id,
				}, 
				this.state.record
			);
		} catch (e) {
			throw e;
		}
		if (res.data === undefined) {
			throw new Error('Unexpected from server, undefined value.');
		}
		this.setState({
			record: res.data,
		});
		return res.data;
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
							onRecordChange={this.onRecordChange}
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

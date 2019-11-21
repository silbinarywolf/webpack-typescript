import React from "react"
import { RouteComponentProps } from "react-router"

import { Form } from "client/form/Form/Form"
import { models } from "client/models";
import { Loading } from "client/coreui/Loading/Loading"
import { http } from "client/http"
import { RecordField } from "client/form/RecordField/RecordField";
import { Button } from "client/form/Button/Button";
//import { EditPageURL } from "client/editrecord/EditPage/register"
//import { routes } from "client/routes"

interface RecordGetResponse {
	data: RecordGetResponseData;
	formModels: { [modelName: string]: models.FormModel }
	records: { [modelName: string]: { [id: number ]: models.FormRecord } }
}

interface RecordGetResponseData {
	id: number;
	model: string;
}

interface State {
	isSubmitting: boolean;
	error: string;
	goToRoute: string;

	data: RecordGetResponseData;
	formModels: { [modelName: string]: models.FormModel }
	records: { [modelName: string]: { [id: number ]: models.FormRecord } }
}

interface Params {
	model: string;
	id: string;
}

interface Props extends RouteComponentProps<Params> {
}

export default class EditPage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props)

		this.state = {
			isSubmitting: false,
			error: "",
			goToRoute: "",

			data: {
				id: 0,
				model: "",
			},
			formModels: {},
			records: {},
		}
	}

	componentDidMount() {
		this.loadRecord()
	}

	readonly onRecordChange = (record: models.FormRecord | undefined): void => {
		throw new Error("Fix saving")
		/*this.setState({
			record: record,
		})*/
	}

	readonly canSave = (): boolean => {
		return !this.state.isSubmitting
	}

	readonly onSaveSubmit = (actionName: string): void => {
		if (!this.canSave()) {
			return
		}
		throw new Error("fix saving")
		/*this.setState({
			error: "",
			isSubmitting: true,
		})
		let isNewRecord: boolean = true
		if (this.state.record) {
			const id = this.state.record["ID"]
			isNewRecord = (id === undefined || id === 0)
		}
		this.updateRecord(actionName)
			.then((record) => {
				if (!record) {
					return
				}
				this.setState({
					isSubmitting: false,
					record: record,
				})
				if (isNewRecord) {
					this.props.history.push(routes.GenerateAdminURL(EditPageURL, {
						id: record.ID,
						model: this.props.match.params.model,
					}))
				}
			})
			.catch((e) => {
				this.setState({
					isSubmitting: false,
					error: String(e),
				})
			})*/
	}

	Record(): models.FormRecord | undefined {
		const id = this.state.data.id;
		const modelName = this.state.data.model;
		const recordMap = this.state.records[modelName];
		if (recordMap === undefined) {
			return;
		}
		const formModel = this.state.formModels[modelName];
		if (formModel === undefined) {
			return;
		}
		const record = recordMap[id];
		if (record === undefined) {
			return;
		}
		return record;
	}

	// NOTE(Jake): 2019-11-02
	// Think of a better name?
	// fetchRecord? postRecord?
	async loadRecord(): Promise<void> {
		let id: number | string | undefined = this.props.match.params.id
		if (id === undefined ||
			id === "0" ||
			id === "") {
			id = 0
		}
		this.setState({
			error: "",
		})
		let response: RecordGetResponse
		try {
			response = await http.Get<RecordGetResponse>("/api/record/:model/get/:id", {
				model: this.props.match.params.model,
				id: id,
			})
		} catch (e) {
			this.setState({
				error: String(e),
			})
			return
		}
		this.setState({
			data: response.data,
			records: response.records,
			formModels: response.formModels,
		})
	}

	async saveRecord(): Promise<models.FormRecord | undefined> {
		interface ModelResponse {
			data: models.FormRecord;
			errors: {[name: string]: string};
		}
		let id: number = this.state.data.id;
		let res;
		try {
			res = await http.Post<ModelResponse>(
				"/api/record/:model/update/:id",
				{
					model: this.state.data.model,
					id: id,
				},
				// todo(Jake): 2019-11-21
				// update this to save multiple records at some point
				this.Record()
			)
		} catch (e) {
			this.setState({
				error: String(e),
			})
			return undefined
		}
		if (res.data === undefined) {
			throw new Error("Unexpected from server, undefined value.")
		}
		console.warn("todo: update this to give back saved records")
	}

	render(): JSX.Element {
		const {
			error,
			isSubmitting,

			data,
			formModels,
			records,
		} = this.state;
		data.id
		return (
			<React.Fragment>
				{data.id === 0 &&
					<React.Fragment>
						{error !== "" &&
							<pre>{error}</pre>
						}
						{error === "" &&
							<Loading/>
						}
					</React.Fragment>
				}
				{data.id !== 0 &&
					<React.Fragment>
						<Form
							id="EditPageForm"
							error={error}
							onSubmit={this.onSaveSubmit}
							disabled={isSubmitting}
						>
							<RecordField
								label={data.model}
								name={data.model}
								recordModel={data.model}
								recordId={data.id}
								records={records}
								formModels={formModels}
								//onChange={this.onRecordChange}
							/>
							<Button
								name="save"
								label="Save"
								type="submit"
								disabled={!this.canSave()}
								onClick={() => this.saveRecord()}
							/>
						</Form>
						{isSubmitting &&
							<p>Saving...</p>
						}
					</React.Fragment>
				}
			</React.Fragment>
		)
	}
}

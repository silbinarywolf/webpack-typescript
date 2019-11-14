import React from "react"
import { RouteComponentProps } from "react-router"

import {
	Form,
	FormModel,
	FormRecord,
} from "client/form/Form/Form"
import { Loading } from "client/coreui/Loading/Loading"
import { http } from "client/http"
import { EditPageURL } from "client/editrecord/EditPage/register"
import { routes } from "client/routes"

interface RecordGetResponse {
	formModel: FormModel
	data: FormRecord | undefined
}

interface State {
	isSubmitting: boolean;
	error: string;
	/**
	 * loadedRecord is the record when it's state
	 * was loaded from the API endpoint.
	 */
	loadedRecord: FormRecord | undefined;
	record: FormRecord | undefined;
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
		super(props)

		this.state = {
			isSubmitting: false,
			error: "",
			loadedRecord: undefined,
			record: undefined,
			model: undefined,
			goToRoute: "",
		}
	}

	componentDidMount() {
		this.getRecord()
	}

	readonly onRecordChange = (record: FormRecord | undefined): void => {
		this.setState({
			record: record,
		})
	}

	readonly canSave = (): boolean => {
		return !this.state.isSubmitting
	}

	readonly onSaveSubmit = (actionName: string): void => {
		if (!this.canSave()) {
			return
		}
		this.setState({
			error: "",
			isSubmitting: true,
		})
		let isNewRecord: boolean = true
		if (this.state.record) {
			const id = this.state.record["ID"]
			isNewRecord = (id === undefined || id === 0 || id === "")
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
						id: record["ID"],
						model: this.props.match.params.model,
					}))
				}
			})
			.catch((e) => {
				this.setState({
					isSubmitting: false,
					error: String(e),
				})
			})
	}

	// NOTE(Jake): 2019-11-02
	// Think of a better name?
	// fetchRecord? postRecord?
	async getRecord(): Promise<FormRecord | undefined> {
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
			response = await http.Get("/api/record/:model/get/:id", {
				model: this.props.match.params.model,
				id: id,
			})
		} catch (e) {
			this.setState({
				error: String(e),
			})
			return undefined
		}
		this.setState({
			model: response.formModel,
			loadedRecord: response.data,
			record: response.data,
		})
		return response.data
	}

	async updateRecord(actionName: string): Promise<FormRecord | undefined> {
		if (actionName === "") {
			throw new Error("Cannot submit with blank actionName.")
		}
		interface ModelResponse {
			data: FormRecord;
			errors: {[name: string]: string};
		}
		let id: number = 0
		if (this.state.record &&
			this.state.record["ID"]) {
			let recordID = this.state.record["ID"]
			if (typeof recordID !== "number") {
				throw new Error("Record ID must be a number type.")
			}
			id = recordID
		}
		let res;
		try {
			res = await http.Post<ModelResponse>(
				"/api/record/:model/:actionName/:id",
				{
					model: this.props.match.params.model,
					actionName: actionName,
					id: id,
				},
				this.state.record
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
		return res.data
	}

	render(): JSX.Element {
		const {
			model,
			record,
			error,
			isSubmitting,
		} = this.state
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
							onSubmit={this.onSaveSubmit}
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

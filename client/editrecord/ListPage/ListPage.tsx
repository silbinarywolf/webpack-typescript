import React from "react"
import { RouteComponentProps } from "react-router"

import { http } from "client/http"
import { models } from "client/models"

import styles from "client/editrecord/ListPage/ListPage.css"

interface RecordListResponse {
	dataModel: models.DataModel
	data: models.FormRecord[] | undefined
}

interface State {
	error: string;
	list: models.FormRecord[];
	dataModel?: models.DataModel;
}

interface Params {
	model: string;
}

interface Props extends RouteComponentProps<Params> {
}

function isTypeObject(type: string): boolean {
	return (type !== "string" &&
		type !== "uint64");
}

export default class ListPage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props)

		this.state = {
			error: "",
			list: [],
		}
	}

	componentDidMount() {
		this.listRecord()
	}

	async listRecord(): Promise<void> {
		this.setState({
			error: "",
		})
		let response;
		try {
			response = await http.Get<RecordListResponse>("/api/record/:model/list", {
				model: this.props.match.params.model,
			})
		} catch (e) {
			this.setState({
				error: String(e),
			})
			return
		}
		this.setState({
			dataModel: response.dataModel,
			list: response.data ? response.data : [],
		})
	}

	render(): JSX.Element {
		const {
			dataModel,
			list,
		} = this.state

		let records: JSX.Element[] = []
		if (dataModel) {
			for (let record of list) {
				if (!record) {
					continue
				}
				const id = record.ID
				let fields: JSX.Element[] = []
				for (let i = 0; i < dataModel.fields.length; i++) {
					const field = dataModel.fields[i]
					if (isTypeObject(field.type)) {
						continue;
					}
					fields.push(
						<td key={field.name}>
							<span>{record[field.name]}</span>
							{i === 0 &&
								<div>
									<a href={"/admin/data/"+this.props.match.params.model+"/edit/"+id}>Edit</a>
								</div>
							}
						</td>
					)
				}
				records.push(
					<tr
						key={id}
					>
						{fields}
					</tr>
				)
			}
		}

		// Column headers
		let headers: JSX.Element[] = []
		if (dataModel) {
			for (let field of dataModel.fields) {
				if (isTypeObject(field.type)) {
					continue;
				}
				headers.push(
					<th key={field.name}>
						{field.name}
					</th>
				)
			}
		}

		return (
			<React.Fragment>
				<div>
					List Record
				</div>
				<table className={styles.table}>
					<thead>
						<tr>
							{headers}
						</tr>
					</thead>
					<tbody>
						{records}
					</tbody>
				</table>
			</React.Fragment>
		)
	}
}

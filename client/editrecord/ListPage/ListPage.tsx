import React from "react";
import { RouteComponentProps } from "react-router";

import { Fetch } from "client/fetch";
import { FormRecord } from "client/form/Form/Form";

import styles from "client/editrecord/ListPage/ListPage.css"

interface RecordListResponse {
	dataModel: DataModel
	data: FormRecord[]
}

interface DataModelField {
	name: string
	type: string
}

interface DataModel {
	name: string
	fields: DataModelField[]
}

interface State {
	error: string;
	list: FormRecord[];
	dataModel?: DataModel;
}

interface Params {
	model: string;
}

interface Props extends RouteComponentProps<Params> {
}

export default class ListPage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			error: '',
			list: [],
		}
	}

	componentDidMount() {
		this.listRecord();
	}

	async listRecord(): Promise<void> {
		this.setState({
			error: '',
		})
		let response: RecordListResponse;
		try {
			response = await Fetch.getJSON("/api/:model/List", {
				model: this.props.match.params.model,
			});
		} catch (e) {
			this.setState({
				error: String(e),
			});
			return;
		}
		this.setState({
			dataModel: response.dataModel,
			list: response.data,
		});
	}

	render(): JSX.Element {
		const {
			dataModel,
			list,
		} = this.state

		let records: JSX.Element[] = [];
		if (dataModel) {
			for (let record of list) {
				if (!record) {
					continue;
				}
				const id = record["ID"];
				let fields: JSX.Element[] = [];
				for (let i = 0; i < dataModel.fields.length; i++) {
					const field = dataModel.fields[i];
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
		let headers: JSX.Element[] = [];
		if (dataModel) {
			for (let field of dataModel.fields) {
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

import React from "react";

import { DataModel } from "client/models/DataModel";
import { Fetch } from "client/fetch";
import { generateAdminURL } from "client/routes";

import styles from "client/coreui/LeftAndMain/LeftAndMain.css";

interface ModelListResponse {
	dataModels: DataModel[]
}

interface Props {
}

interface State {
	error: string;
	dataModels: DataModel[];
}

export class LeftAndMain extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			error: "",
			dataModels: [],
		}
	}

	componentDidMount() {
		this.listDataModels();
	}

	async listDataModels(): Promise<void> {
		this.setState({
			error: '',
		})
		let response: ModelListResponse;
		try {
			response = await Fetch.getJSON("/api/model/list");
		} catch (e) {
			this.setState({
				error: String(e),
			});
			return;
		}
		this.setState({
			dataModels: response.dataModels,
		});
	}

	render() {
		const {
			error,
			dataModels
		} = this.state;
		const {
			children,
		} = this.props;
		return (
			<React.Fragment>
				<div className={styles.menuBack}/>
				<div className={styles.menu}>
					{error !== "" &&
						<p>{error}</p>
					}
					<ul className={styles.menuList}>
						{dataModels.map((dataModel) => {
							return (
								<li>
									<a
										href={generateAdminURL("/data/:model", {
											model: dataModel.name,
										})}
										className={styles.menuLink}
									>
										{dataModel.name}
									</a>
								</li>
							)
						})}
					</ul>
				</div>
				<div
					className={styles.layout}
				>
					{children}
				</div>
			</React.Fragment>
		)
	}
}

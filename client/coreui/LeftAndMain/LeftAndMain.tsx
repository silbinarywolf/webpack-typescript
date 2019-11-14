import React from "react"

import { DataModel } from "client/models/DataModel"
import { http } from "client/http"
import { routes } from "client/routes"

import styles from "client/coreui/LeftAndMain/LeftAndMain.css"

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
		super(props)

		this.state = {
			error: "",
			dataModels: [],
		}
	}

	componentDidMount() {
		this.listDataModels()
	}

	async listDataModels(): Promise<void> {
		this.setState({
			error: "",
		})
		let response;
		try {
			response = await http.Get<ModelListResponse>("/api/model/list")
		} catch (e) {
			this.setState({
				error: String(e),
			})
			return
		}
		this.setState({
			dataModels: response.dataModels,
		})
	}

	render() {
		const {
			error,
			dataModels
		} = this.state
		const {
			children,
		} = this.props
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
								<li key={dataModel.name}>
									<a
										href={routes.GenerateAdminURL("/data/:model", {
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

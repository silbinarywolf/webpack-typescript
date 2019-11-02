import React from "react";
import { RouterProps, match } from "react-router";

interface Props extends RouterProps, match<void> {
}

export default class DashboardPage extends React.Component<Props> {
	constructor(props: Props) {
		super(props);
	}

	render(): JSX.Element {
		return (
			<React.Fragment>
				<h1>Dashboard</h1>
				<p>TODO</p>
			</React.Fragment>
		)
	}
}

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
				<p>Dashboard TODO</p>
			</React.Fragment>
		)
	}
}

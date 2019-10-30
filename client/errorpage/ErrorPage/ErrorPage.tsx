import React from "react";
import { RouterProps } from "react-router";

interface Props extends RouterProps {
}

export default class ErrorPage extends React.Component<Props> {
	constructor(props: Props) {
		super(props);
	}

	render(): JSX.Element {
		return (
			<React.Fragment>
				<h1>Error</h1>
				<p>This page does not exist.</p>
			</React.Fragment>
		)
	}
}

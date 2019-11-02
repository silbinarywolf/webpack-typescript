import React from "react";
import { RouteComponentProps } from "react-router";

interface State {
}

interface Params {
	model: string;
}

interface Props extends RouteComponentProps<Params> {
}

export default class ListPage extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {}
	}

	render(): JSX.Element {
		return (
			<React.Fragment>
				<div>
					List Record
				</div>
			</React.Fragment>
		)
	}
}

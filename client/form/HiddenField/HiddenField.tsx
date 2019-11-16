import React from "react";

interface State {
}

interface Props {
	name: string;
	value: string | number;
}

export class HiddenField extends React.Component<Props, State> {
	render(): JSX.Element {
		const {
			name,
			value,
		} = this.props;
		const id = name;
		return (
			<input
				id={id}
				name={name}
				type="hidden"
				value={value}
			/>
		)
	}
}

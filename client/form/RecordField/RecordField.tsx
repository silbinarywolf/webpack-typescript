import React from "react";

import { models } from "client/models";
import { FormField } from "client/form/FormField/FormField";

interface State {
}

interface Props extends FormField {
	value: models.FormRecord;
	disabled?: boolean;
	onChange: (value: string) => void;
}

export class RecordField extends React.Component<Props, State> {
	onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const {
			onChange
		} = this.props;
		onChange(e.target.value);
	}

	render(): JSX.Element {
		const {
			label,
			children,
		} = this.props
		return (
			<fieldset>
    			<legend>{label}</legend>
    			{children}
    		</fieldset>
		)
	}
}

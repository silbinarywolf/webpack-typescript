import React from "react";

import { FormField } from "client/form/FormField/FormField";
import { FieldHolder } from "client/form/FieldHolder/FieldHolder";

import styles from "client/form/TextField/TextField.css";

interface State {
}

interface Props extends FormField {
	value: string | number;
	disabled?: boolean;
	onChange: (value: string | number) => void;
}

export class TextField extends React.Component<Props, State> {
	onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const {
			value,
			onChange
		} = this.props;
		let newValue: string | number = e.target.value;
		if (typeof value === "number") {
			newValue = parseInt(newValue, 10);
			onChange(newValue);
			return;
		} else {
			onChange(newValue);
		}
	}

	render(): JSX.Element {
		const {
			name,
			label,
			disabled,
			value,
		} = this.props;
		const id = name;
		return (
			<FieldHolder
				id={id}
				label={label}
			>
				<input
					id={id}
					name={name}
					type="text"
					className={styles.input}
					value={value}
					disabled={disabled}
					onChange={this.onChange}
				/>
			</FieldHolder>
		)
	}
}

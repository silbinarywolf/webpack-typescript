import React from "react";

import { FieldHolder } from "client/form/FieldHolder/FieldHolder.tsx";

import styles from "client/form/TextField/TextField.css";

interface State {
}

interface Props {
	name: string;
	label: string;
	value: string;
	disabled?: boolean;
	onChange: (value: string) => void;
}

export class TextField extends React.Component<Props, State> {
	onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const {
			onChange
		} = this.props;
		onChange(e.target.value);
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

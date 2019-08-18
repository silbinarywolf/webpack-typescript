import React from "react";

import styles from "./Button.css";

interface ButtonProps {
	label: string;
}

export function Button(props: ButtonProps): JSX.Element {
	const {
		label
	} = props;
	return (
		<button
			type="button"
			className={styles.button}
		>
			${label}
		</button>
	)
}

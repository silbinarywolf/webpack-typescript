import React from "react";

import styles from "client/form/Button/Button.css";

interface Props {
	label: string;
	type?: "button" | "submit";
	onClick: (() => void) | undefined;
	disabled?: boolean;
}

export function Button(props: Props): JSX.Element {
	const {
		label,
		type,
		disabled,
		onClick,
	} = props;
	return (
		<button
			type={type !== undefined ? type : "button"}
			className={styles.button}
			disabled={disabled}
			onClick={(e) => {
				e.preventDefault();
				if (onClick !== undefined) {
					onClick()
				}
			}}
		>
			{label}
		</button>
	)
}

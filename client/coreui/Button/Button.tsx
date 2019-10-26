import React from "react";

import styles from "client/coreui/Button/Button.css";

interface Props {
	label: string;
	onClick: () => void;
}

export function Button(props: Props): JSX.Element {
	const {
		label,
		onClick,
	} = props;
	return (
		<button
			type="button"
			className={styles.button}
			onClick={onClick}
		>
			{label}
		</button>
	)
}

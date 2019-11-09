import React from "react"

import styles from "client/form/FieldHolder/FieldHolder.css"

interface Props {
    id: string;
    label: string;
    message?: string;
}

export function FieldHolder(props: React.PropsWithChildren<Props>): JSX.Element {
	const {
		id,
		label,
		message,
		children,
	} = props
	return (
		<div>
			<label
				htmlFor={id}
				className={styles.label}
			>
				{label}
			</label>
			<div>
				{children}
			</div>
			{ message ? <p>{message}</p> : undefined }
		</div>
	)
}

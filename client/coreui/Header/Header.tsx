import React from "react";

import styles from "client/coreui/Header/Header.css";

interface Props {
}

export function Header(props: Props): JSX.Element {
	return (
		<div
			className={[
				styles.root,
			].join(' ')}
		>
			<p className={styles.name}>Data Editor</p>
		</div>
	)
}

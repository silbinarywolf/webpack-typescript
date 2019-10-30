import React from "react";

import styles from "client/coreui/Container/Container.css";

interface Props {
}

export function Container(props: React.PropsWithChildren<Props>): JSX.Element {
	const {
		children,
	} = props;
	return (
		<div
			className={[
				styles.root,
			].join(' ')}
		>
			{children}
		</div>
	)
}

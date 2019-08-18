import React from "react";

import ContainerStyle from "./Container.css";

interface HeaderProps {
}

export function Container(props: React.PropsWithChildren<HeaderProps>): JSX.Element {
	const {
		children,
	} = props;
	return (
		<div
			className={[
				ContainerStyle.root,
			].join(' ')}
		>
			{children}
		</div>
	)
}

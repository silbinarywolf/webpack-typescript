import React from "react";

import HeaderStyle from "./Header.css";

interface HeaderProps {
}

export function Header(props: HeaderProps): JSX.Element {
	return (
		<div
			className={[
				HeaderStyle.root,
			].join(' ')}
		>

		</div>
	)
}

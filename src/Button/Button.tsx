import React from "react";

import ButtonResetStyle from "~/ButtonReset/ButtonReset.css";
import ButtonStyle from "./Button.css";

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
			className={[
				ButtonResetStyle.reset,
				ButtonStyle.button,
			].join(' ')}
		>
			{label}
		</button>
	)
}

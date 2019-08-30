import React from "react";

// NOTE(Jake): 2019-08-30
// If you import "ButtonResetStyle" after "ButtonStyle", it will have precedence over
// those styles. Should probably import various reset styles in main.tsx before any other
// components/CSS to ensure CSS output order is correct.
// ie. import "~/ButtonReset/ButtonReset.css";
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

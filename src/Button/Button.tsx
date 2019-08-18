import { styles } from './Button.scss';

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

import React from "react";

// import { models } from "client/models";
// import { Button } from "client/form/Button/Button";

interface Props {
	id: string;
	error: string;
	disabled?: boolean;
	onSubmit: (actionName: string) => void;
}

/*function onChangeField(rootRecord: models.FormRecord, record: models.FormRecord, name: string, value: string | number, onRecordChange: (record: models.FormRecord | undefined) => void): void {
	const oldValue = record[name];
	if (value === oldValue) {
		// do nothing if no real value change
		return;
	}

	// NOTE(Jake): 2019-11-16
	// Maybe we need to generate a new object at this level too?
	// So that things are properly immutable.
	record[name] = value;

	// Force new object creation at root so re-render can occur
	rootRecord = {
		...rootRecord,
	};
	onRecordChange(rootRecord)
}*/

export function Form(props: React.PropsWithChildren<Props>): JSX.Element {
	//const onSubmitButton = (actionName: string): void => {
	//	props.onSubmit(actionName)
	//}

	const {
		id,
		error,
		/*record,
		model,
		disabled,
		onRecordChange,*/
		children,
	} = props;
	const errorId = id + '_error';
	return (
		<form
			id={id}
			aria-describedby={errorId}
		>
			{error !== "" &&
				<p id={errorId}>
					{error}
				</p>
			}
			{children}
		</form>
	)
}

import React from "react";

interface Props {
}

interface State {
	error: Error | undefined;
}

export class ErrorBoundary extends React.Component<Props, State> {
	state: State = {
		error: undefined,
	};

	static getDerivedStateFromError(error: Error) {
		return {
			error: error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// You can also log the error to an error reporting service
		// logErrorToMyService(error, errorInfo);
	}

	render() {
		const {
			error
		} = this.state;
		if (error) {
			return (
				<React.Fragment>
					<h2>Something went wrong.</h2>
					<p>{String(error)}</p>
				</React.Fragment>
			);
		}

		return this.props.children;
	}
}

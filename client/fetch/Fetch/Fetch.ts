export namespace Fetch {
	interface FetchState {
		baseUrl: string;
	}

	const state: FetchState = {
		baseUrl: "",
	}

	export function setBaseUrl(baseUrl: string) {
		state.baseUrl = baseUrl;
	}

	export async function postJSON<T>(uri: string, data: {[prop: string]: any} | undefined): Promise<T> {
		if (data === undefined) {
			throw new Error("postJSON: data cannot be undefined.");
		}
		const url = state.baseUrl + uri;
		let response: Response;
		try {
			response = await fetch(url, {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
			    },
			    method: "POST",
			    body: JSON.stringify(data),
			});
			if (!response.ok) {
		        throw Error(String(response.status) + " " + response.statusText);
		    }
		} catch (e) {
			throw e;
		}
		let content: T;
		try {
			content = await response.json();
		} catch (e) {
			throw e;
		}
		return content;
	}
}

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

	export function baseUrl(): string {
		return state.baseUrl;
	}

	export async function getJSON<T>(uri:string, params?: {[param: string]: any}): Promise<T> {
		uri = buildUriAndParams(uri, params);
		const url = state.baseUrl + uri;
		let response: Response;
		try {
			response = await fetch(url, {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
			    },
			    method: "GET",
			});
		} catch (e) {
			throw e;
		}
		if (!response.ok) {
			const body: string = await response.text();
			if (body) {
				throw new Error(body);
			}
	        throw new Error(String(response.status) + " " + response.statusText);
	    }
		let content: T;
		try {
			content = await response.json();
		} catch (e) {
			throw e;
		}
		return content;
	}

	export async function postJSON<T>(uri: string, params: {[param: string]: string | number} | undefined, postBodyData: {[param: string]: any} | undefined): Promise<T> {
		if (params === undefined) {
			throw new Error("postJSON: params cannot be undefined.");
		}
		uri = buildUriAndParams(uri, params);
		const url = state.baseUrl + uri;
		let response: Response;
		try {
			response = await fetch(url, {
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
			    },
			    method: "POST",
			    body: JSON.stringify(postBodyData),
			});
		} catch (e) {
			throw e;
		}
		if (!response.ok) {
			const body: string = await response.text();
			if (body) {
				throw new Error(body);
			}
	        throw new Error(String(response.status) + " " + response.statusText);
	    }
		let content: T;
		try {
			content = await response.json();
		} catch (e) {
			throw e;
		}
		return content;
	}

	export function buildUriAndParams(uri: string, params: {[param: string]: string | number} | undefined): string {
		let newParams: {[param: string]: string | number} | undefined = undefined;
		if (params) {
			// NOTE(Jake): 2019-10-30
			// Create a copy so we don't mutate the params object given.
			newParams = {...params};
			let oldUri = uri;
			for (let paramName in newParams) {
				if (!newParams.hasOwnProperty(paramName)) {
					continue;
				}
				uri = uri.replace(':' + paramName, encodeURIComponent(newParams[paramName]));
				if (uri !== oldUri) {
					// If we replaced the param, remove from map
					// (so we don't append to ?)
					delete newParams[paramName];
					oldUri = uri;
				}
			}
			let isEmpty = true;
			for(var paramName in newParams) {
				if (!newParams.hasOwnProperty(paramName)) {
					continue;
				}
				isEmpty = false;
			}
			if (isEmpty) {
				newParams = undefined;
			}
		}
		if (newParams !== undefined) {
			// Make remaining parameters be appended to ?
			uri += '?';
			for(var paramName in newParams) {
				if (!newParams.hasOwnProperty(paramName)) {
					continue;
				}
				uri += paramName + '=' + encodeURIComponent(newParams[paramName]);
			}
		}
		return uri;
	}
}

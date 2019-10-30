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

	export function BaseUrl(): string {
		return state.baseUrl;
	}

	export async function getJSON<T>(uri:string, params?: {[param: string]: any}): Promise<T> {
		[uri, params] = buildUriAndParams(uri, params);
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

	export async function postJSON<T>(uri: string, params: {[param: string]: any} | undefined, postBodyData: {[param: string]: any} | undefined): Promise<T> {
		if (params === undefined) {
			throw new Error("postJSON: params cannot be undefined.");
		}
		[uri, params] = buildUriAndParams(uri, params);
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

	export function buildUriAndParams(uri: string, params: {[param: string]: any} | undefined): [string, {[param: string]: any} | undefined] {
		let newParams: {[param: string]: any} | undefined = undefined;
		if (params) {
			newParams = {...params};
			let oldUri = uri;
			for (let paramName in newParams) {
				if (!newParams.hasOwnProperty(paramName)) {
					continue;
				}
				uri = uri.replace(':' + paramName, encodeURIComponent(newParams[paramName]));
				if (uri !== oldUri) {
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
			uri += '?';
			for(var paramName in newParams) {
				if (!newParams.hasOwnProperty(paramName)) {
					continue;
				}
				uri += paramName + '=' + encodeURIComponent(newParams[paramName]);
			}
		}
		return [uri, newParams];
	}
}

import { time } from "client/time"

export namespace http {
	interface FetchState {
		baseUrl: string
	}

	/**
	 * HttpError is thrown by various fetch functions so that it
	 * can be caught and handled specifically with (instanceof FetchError).
	 */
	interface httpError {
		timestamp: time.Time; // "2019-02-27T04:03:52.398+0000"
		status: number; // 500
		error: string; // "Internal Server Error",
		message: string; // "Book id not found : 5"
		path: string; // "/path"
		toString(): string;
	}

	export class HttpError extends Error {
		private data: httpError;

		constructor(data: httpError) {
			super();
			this.data = data;
		}

		toString(): string {
			if (this.data.message) {
				return this.data.message;
			}
			return this.data.error;
		}
	}

	const state: FetchState = {
		baseUrl: "",
	}

	export function SetBaseUrl(baseUrl: string) {
		state.baseUrl = baseUrl
	}

	export function BaseUrl(): string {
		return state.baseUrl
	}

	export async function Get<T>(uri:string, params?: {[param: string]: any}): Promise<T> {
		uri = buildUriAndParams(uri, params)
		const url = state.baseUrl + uri
		const body = request<T>(url, {
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			method: "GET",
		})
		return body;
	}

	export async function Post<T>(uri: string, params: {[param: string]: string | number} | undefined, postBodyData: {[param: string]: any} | undefined): Promise<T> {
		uri = buildUriAndParams(uri, params)
		const url = state.baseUrl + uri
		const body = await request<T>(url, {
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			method: "POST",
			body: JSON.stringify(postBodyData),
		})
		return body;
	}

	async function request<T>(input: RequestInfo, init: RequestInit | undefined): Promise<T> {
		let response: Response | undefined;
		try {
			response = await fetch(input, init);
		} catch (e) {
			throw new HttpError({
				timestamp: time.Now(),
				status: 404,
				error: "Not Found",
				message: "",
				path: "",
			});
		}
		if (!response.ok) {
			const body: string = await response.text()
			const err = new HttpError({
				timestamp: time.Now(),
				status: response.status,
				error: response.statusText,
				message: body,
				path: "",
			});
			if (body) {
				throw err;
			}
			throw err;
		}
		let body: T
		try {
			body = await response.json()
		} catch (e) {
			const err = new HttpError({
				timestamp: time.Now(),
				status: response.status,
				error: String(e),
				message: "Cannot decode JSON",
				path: "",
			});
			throw err;
		}
		return body
	}

	export function buildUriAndParams(uri: string, params: {[param: string]: string | number} | undefined): string {
		let newParams: {[param: string]: string | number} | undefined = undefined
		if (params) {
			// NOTE(Jake): 2019-10-30
			// Create a copy so we don't mutate the params object given.
			newParams = {...params}
			let oldUri = uri
			for (let paramName in newParams) {
				if (!Object.prototype.hasOwnProperty.call(newParams, paramName)) {
					continue
				}
				uri = uri.replace(":" + paramName, encodeURIComponent(newParams[paramName]))
				if (uri !== oldUri) {
					// If we replaced the param, remove from map
					// (so we don't append to ?)
					delete newParams[paramName]
					oldUri = uri
				}
			}
			let isEmpty = true
			for(var paramName in newParams) {
				if (!Object.prototype.hasOwnProperty.call(newParams, paramName)) {
					continue
				}
				isEmpty = false
			}
			if (isEmpty) {
				newParams = undefined
			}
		}
		if (newParams !== undefined) {
			// Make remaining parameters be appended to ?
			uri += "?"
			for(var paramName in newParams) {
				if (!Object.prototype.hasOwnProperty.call(newParams, paramName)) {
					continue
				}
				uri += paramName + "=" + encodeURIComponent(newParams[paramName])
			}
		}
		return uri
	}
}

interface FetchState {
	baseUrl: string
}

/**
 * FetchError is thrown by various fetch functions so that it
 * can be caught and handled specifically with (instanceof FetchError).
 */
export class FetchError extends Error {
	// todo(Jake): 2019-11-09
	// Maybe generate a timestamp?
	// private readonly timestamp: string // "2019-05-03T23:59:52.103"

	constructor(message: string, error: Error | undefined) {
		if (message === "" && error) {
			message = error.message
		}
		super(message)
		// Maintains proper stack trace (only on V8)
		// (Took this snippet from: https://stackoverflow.com/a/52461437/5013410)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, FetchError)
		}
	}
}

const state: FetchState = {
	baseUrl: "",
}

export function setBaseUrl(baseUrl: string) {
	state.baseUrl = baseUrl
}

export function baseUrl(): string {
	return state.baseUrl
}

export async function getJSON<T>(uri:string, params?: {[param: string]: any}): Promise<T> {
	uri = buildUriAndParams(uri, params)
	const url = state.baseUrl + uri
	let response: Response
	try {
		response = await fetch(url, {
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			method: "GET",
		})
	} catch (e) {
		throw new FetchError("Failed to fetch", e)
	}
	if (!response.ok) {
		const body: string = await response.text()
		if (body) {
			throw new FetchError(body, undefined)
		}
		throw new FetchError(String(response.status) + " " + response.statusText, undefined)
	}
	let content: T
	try {
		content = await response.json()
	} catch (e) {
		throw new FetchError("Cannot decode json", e)
	}
	return content
}

export async function postJSON<T>(uri: string, params: {[param: string]: string | number} | undefined, postBodyData: {[param: string]: any} | undefined): Promise<T> {
	if (params === undefined) {
		throw new FetchError("postJSON: params cannot be undefined.", undefined)
	}
	uri = buildUriAndParams(uri, params)
	const url = state.baseUrl + uri
	let response: Response
	response = await fetch(url, {
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		},
		method: "POST",
		body: JSON.stringify(postBodyData),
	})
	if (!response.ok) {
		const body: string = await response.text()
		if (body) {
			throw new FetchError(body, undefined)
		}
		throw new FetchError(String(response.status) + " " + response.statusText, undefined)
	}
	let content: T
	try {
		content = await response.json()
	} catch (e) {
		throw new FetchError("Cannot decode json", e)
	}
	return content
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

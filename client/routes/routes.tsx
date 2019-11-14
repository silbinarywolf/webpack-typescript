import { RouteComponentProps } from "react-router-dom"

import { http } from "client/http"

export namespace routes {

	// NOTE(Jake): 2019-11-02
	// Not sure about importing "react". I want this package
	// to be decoupled from React as much as possible as its
	// meant to just reason about routes and route-order.
	type Component = (
		React.ComponentType<RouteComponentProps<any>> |
		React.ComponentType<any>
	)

	export interface RouteProps {
		path: string;
		component: Component;
		params?: {[paramName: string]: string}
	}

	const routes: RouteProps[] = []

	/**
	 * debugAccessedConstant will be marked as true if data has been
	 * retrieved and should no longer be touched.
	 */
	let debugAccessedConstant = false

	let fallbackRoute: RouteProps | undefined

	// NOTE(Jake): 2019-10-30
	// If I reuse all this code to build a CMS, I want this
	// to be configurable.
	const AdminURL = "admin"

	export function Routes(): readonly Readonly<RouteProps>[] {
		if (process.env.NODE_ENV === "development") {
			debugAccessedConstant = true
		}
		return routes
	}

	export function FallbackRoute(): Readonly<RouteProps> | undefined {
		if (process.env.NODE_ENV === "development") {
			debugAccessedConstant = true
		}
		return fallbackRoute
	}

	/**
	 * RegisterRoute adds a component to the list of routes
	 */
	export function RegisterRoute(route: RouteProps) {
		if (process.env.NODE_ENV === "development" &&
			debugAccessedConstant === true) {
			throw new Error("SetFallbackRoute cannot be called after calling Routes() or FallbackRoute().")
		}
		if (!route.path) {
			throw new Error("\"path\" must be not empty.")
		}
		if (process.env.NODE_ENV === "development" &&
			route.path[0] !== "/") {
			throw new Error("Invalid path, must begin with /")
		}
		route.path = "/" + AdminURL + route.path
		routes.push(route)
	}

	/**
	 * SetFallbackRoute is the component rendered if none of the URLs match.
	 * Used for 404 pages.
	 */
	export function SetFallbackRoute(route: RouteProps) {
		if (process.env.NODE_ENV === "development" &&
			debugAccessedConstant === true) {
			throw new Error("SetFallbackRoute cannot be called after calling Routes() or FallbackRoute().")
		}
		if (route.path) {
			throw new Error("A fallback route should not have a \"path\" property set.")
		}
		if (fallbackRoute) {
			throw new Error("Cannot register more than 1 route with no path defined. This is reserved for 404 page error handling.")
		}
		fallbackRoute = route
		return
	}

	export function GenerateAdminURL<T extends {[prop: string]: string | number}>(uri: string, routeProps: T) {
		return http.buildUriAndParams("/" + AdminURL + uri, routeProps)
	}
}

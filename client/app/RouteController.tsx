import React from "react"
import {
	Route,
	Redirect,
	Switch,
} from "react-router-dom"
import {
	BrowserRouter as Router,
} from "react-router-dom"

import { Routes, FallbackRoute } from "client/routes"

export function RouteController(): JSX.Element {
	const routes = Routes()
	if (routes.length === 0) {
		throw new Error("No routes are registered.")
	}

	// Build route list
	let routeElements: JSX.Element[] = []
	for (let route of routes) {
		routeElements.push(
			<Route
				key={route.path}
				path={route.path}
				component={route.component}
				params={route.params}
				exact
			/>
		)
	}

	// Fallback route
	const fallbackRoute = FallbackRoute()
	if (!fallbackRoute) {
		throw new Error("Must configure a FallbackRoute with SetFallbackRoute.")
	}

	return (
		<Router>
			<Switch>
				<Route
					path="/"
					exact
				>
					<Redirect to={typeof routes[0].path === "string" ? routes[0].path : ""} />
				</Route>
				{routeElements}
				<Route
					component={fallbackRoute.component}
					params={fallbackRoute.params}
				/>
			</Switch>
		</Router>
	)
}

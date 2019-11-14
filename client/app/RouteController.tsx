import React from "react"
import {
	Route,
	Redirect,
	Switch,
} from "react-router-dom"
import {
	BrowserRouter as Router,
} from "react-router-dom"

import { routes } from "client/routes"

export function RouteController(): JSX.Element {
	const routeList = routes.Routes()
	if (routeList.length === 0) {
		throw new Error("No routes are registered.")
	}

	// Build route list
	let routeElements: JSX.Element[] = []
	for (let route of routeList) {
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
	const fallbackRoute = routes.FallbackRoute()
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
					<Redirect to={typeof routeList[0].path === "string" ? routeList[0].path : ""} />
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

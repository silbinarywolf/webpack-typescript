import React from "react";
import {
	Route,
	Redirect,
	Switch,
} from "react-router-dom";

import { Routes, FallbackRoute } from "client/routes";

export function RouteController(props: {}): JSX.Element {
	const routes = Routes();
	if (routes.length === 0) {
		throw new Error("No routes are registered.");
	}
	let routeElements: JSX.Element[] = [];
	for (let route of routes) {
		routeElements.push(
			<Route
				key={route.path}
				component={route.component}
				params={route.params}
			/>
		)
	}

	// Fallback route
	const fallbackRoute = FallbackRoute();
	if (!fallbackRoute) {
		throw new Error("Must configure a FallbackRoute with SetFallbackRoute.");
	}

	return (
		<Switch>
			<Route
				path="/"
				exact
			>
				<Redirect to={typeof routes[0].path === 'string' ? routes[0].path : ''} />
			</Route>
			{routeElements}
			{ fallbackRoute ?
				<Route
					component={fallbackRoute.component}
				/> : undefined
			}
		</Switch>
	);
}

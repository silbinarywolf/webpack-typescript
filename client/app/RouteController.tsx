import React from "react";
import {
	Route,
	Redirect,
	Switch,
} from "react-router-dom";

import { Routes, FallbackRoute } from "client/routes";

export function RouterController(): JSX.Element {
	const routes = Routes();
	if (routes.length === 0) {
		throw new Error("No routes are registered.");
	}
	let routeElements: JSX.Element[] = [];
	for (let props of routes) {
		routeElements.push(
			<Route
				key={props.path}
				component={props.component}
				params={props.params}
				exact
			/>
		)
	}
	const fallbackRoute = FallbackRoute();
	if (fallbackRoute) {
		const props = fallbackRoute;
		routeElements.push(
			<Route
				key=".fallback"
				component={props.component}
				params={props.params}
			/>
		)
	}
	return (
		<Switch>
			<Route
				exact
				path="/"
			>
				<Redirect to={typeof routes[0].path === 'string' ? routes[0].path : ''} />
			</Route>
			{routeElements}
		</Switch>
	);
}

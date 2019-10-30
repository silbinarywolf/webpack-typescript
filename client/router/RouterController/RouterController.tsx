import React from "react";
import {
	Route,
	RouteProps as ReactRouteProps,
	Redirect,
	Switch,
} from "react-router-dom";

import { Loading } from "client/coreui/Loading/Loading";
import { Fetch } from "client/fetch/Fetch/Fetch";

interface RouteProps extends ReactRouteProps {
	params?: {[paramName: string]: string}
}

const routes: RouteProps[] = [];

let anyOrErrorHandleRoute: RouteProps | undefined;

// NOTE(Jake): 2019-10-30
// If I reuse all this code to build a CMS, I want this
// to be configurable.
const CMSURLPart = 'admin';

export function RegisterRoute(route: RouteProps) {
	// TODO(Jake): 2019-10-30
	// Split this into its own function, RegisterFallback
	if (!route.path) {
		if (anyOrErrorHandleRoute) {
			throw new Error("Cannot regsiter more than 1 route with no path defined. This is reserved for 404 page error handling.");
		}
		anyOrErrorHandleRoute = route;
		return;
	}
	route.path = "/" + CMSURLPart + route.path;
	routes.push(route);
}

export function RouterController(): JSX.Element {
	if (routes.length === 0) {
		throw new Error("No routes are registered.");
	}
	let routeElements: JSX.Element[] = [];
	for (let routeProps of routes) {
		if (typeof routeProps.path !== 'string') {
			throw new Error('path must be a string, string[] is forbidden.');
		}
		routeElements.push(
			<Route 
				key={routeProps.path} 
				{...routeProps} 
				exact
			/>
		)
	}
	return (
		<React.Suspense fallback={<Loading/>}>
			<Switch>
				<Route
					exact 
					path="/"
				>
					<Redirect to={typeof routes[0].path === 'string' ? routes[0].path : ''} />
				</Route>
				{routeElements}
				{anyOrErrorHandleRoute ? 
					<Route {...anyOrErrorHandleRoute} /> : undefined
				}
			</Switch>
		</React.Suspense>
	);
}

export function generateURL<T extends {[prop: string]: string | number}>(uri: string, routeProps: T) {
	return Fetch.buildUriAndParams("/" + CMSURLPart + uri, routeProps);
}

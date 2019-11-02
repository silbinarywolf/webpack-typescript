import React from "react";
import ReactDOM from "react-dom";
import {
	BrowserRouter,
} from "react-router-dom";

import "client/app/App.css";
import "client/form/ButtonReset/ButtonReset.css"
import "client/coreui/ListReset/ListReset.css"

import { Header } from "client/coreui/Header/Header";
import { LeftAndMain } from "client/coreui/LeftAndMain/LeftAndMain";
import { ErrorBoundary } from "client/coreui/ErrorBoundary/ErrorBoundary";
import { Fetch } from "client/fetch";
import { RouterController } from "client/app/RouteController";
import { Loading } from "client/coreui/Loading/Loading";

// Register pages
import "client/coreui/DashboardPage/register";
import "client/editrecord/EditPage/register";
import "client/errorpage/ErrorPage/register";

export function StartApp() {
	if (process.env.NODE_ENV !== 'production') {
		console.warn('This is a development mode build.');
	}
	if (Fetch.baseUrl() === '') {
		Fetch.setBaseUrl("http://localhost:8080");
	}

	ReactDOM.render(
		<ErrorBoundary>
			<Header/>
			<LeftAndMain>
				<BrowserRouter>
					<React.Suspense fallback={<Loading/>}>
						<RouterController/>
					</React.Suspense>
				</BrowserRouter>
			</LeftAndMain>
		</ErrorBoundary>,
		document.getElementById("app")
	);
}

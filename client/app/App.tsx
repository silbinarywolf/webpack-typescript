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
import { Fetch } from "client/fetch/Fetch/Fetch";
import { RouterController } from "client/router/RouterController/RouterController";

// Register pages
import "client/coreui/DashboardPage/register";
import "client/editrecord/EditPage/register";
import "client/errorpage/ErrorPage/register";

export function StartApp() {
	if (Fetch.BaseUrl() === '') {
		Fetch.setBaseUrl("http://localhost:8080");
	}

	ReactDOM.render(
		<ErrorBoundary>
			<BrowserRouter>
				<Header/>
				<LeftAndMain>
					<RouterController/>
				</LeftAndMain>
			</BrowserRouter>
		</ErrorBoundary>,
		document.getElementById("app")
	);
}

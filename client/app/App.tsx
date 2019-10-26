import React from "react";
import ReactDOM from "react-dom";
import {
	BrowserRouter as Router,
	Route,
	Switch,
} from "react-router-dom";

import "client/app/App.css";
import "client/form/ButtonReset/ButtonReset.css"
import "client/coreui/ListReset/ListReset.css"

import { Header } from "client/coreui/Header/Header";
import { LeftAndMain } from "client/coreui/LeftAndMain/LeftAndMain";
import { ErrorBoundary } from "client/coreui/ErrorBoundary/ErrorBoundary";
import { Fetch } from "client/fetch/Fetch/Fetch";
import { Loading } from "client/coreui/Loading/Loading";

// todo(Jake): 2019-10-26
// Use system to register routes when importing files
const EditPage = React.lazy(() => import("client/coreui/EditPage/EditPage"));

export function StartApp() {
	Fetch.setBaseUrl("http://localhost:8080");

	ReactDOM.render(
		<ErrorBoundary>
			<Router>
				<Header/>
				<LeftAndMain>
					<Switch>
						<React.Suspense fallback={<Loading/>}>
							<Route exact path="/" component={EditPage}/>
							<Route path="/edit">
								<input type="text"/>
							</Route>
							<Route path="/dashboard">
								<p>Dashboard todo</p>
							</Route>
						</React.Suspense>
					</Switch>
				</LeftAndMain>
			</Router>
		</ErrorBoundary>,
		document.getElementById("app")
	);
}

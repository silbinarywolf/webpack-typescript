import React from "react";
import ReactDOM from "react-dom";
import {
	BrowserRouter as Router,
	Route,
	Switch,
} from "react-router-dom";

import "client/app/App.css";
import "client/coreui/ButtonReset/ButtonReset.css"
import "client/coreui/ListReset/ListReset.css"

import { Header } from "client/coreui/Header/Header";
import { Container } from "client/coreui/Container/Container";
import { Button } from "client/coreui/Button/Button";
import { LeftAndMain } from "client/coreui/LeftAndMain/LeftAndMain";
import { ErrorBoundary } from "client/coreui/ErrorBoundary/ErrorBoundary";

import styles from "client/app/App.css";

// todo(Jake): 2019-10-26
// Use system to register routes when importing files
const EditPage = React.lazy(() => import("client/coreui/EditPage/EditPage"));

export function StartApp() {
	ReactDOM.render(
		<ErrorBoundary>
			<Router>
				<div className={styles.wrap}>
					<Header/>
					<LeftAndMain>
						<Switch>
							<React.Suspense fallback={<div>Loading...</div>}>
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
				</div>
			</Router>
		</ErrorBoundary>,
		document.getElementById("app")
	);
}

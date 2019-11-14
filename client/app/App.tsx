import React from "react"
import ReactDOM from "react-dom"

import "client/app/App.css"
import "client/form/ButtonReset/ButtonReset.css"
import "client/coreui/ListReset/ListReset.css"

import { Header } from "client/coreui/Header/Header"
import { LeftAndMain } from "client/coreui/LeftAndMain/LeftAndMain"
import { ErrorBoundary } from "client/coreui/ErrorBoundary/ErrorBoundary"
import { http } from "client/http"
import { RouteController } from "client/app/RouteController"
import { Loading } from "client/coreui/Loading/Loading"

// Register pages
import "client/dashboardpage"
import "client/editrecord"
import "client/errorpage"

export function StartApp() {
	if (process.env.NODE_ENV !== "production") {
		console.warn("This is a development mode build.")
	}
	if (http.BaseUrl() === "") {
		http.SetBaseUrl("http://localhost:8080");
	}

	ReactDOM.render(
		<ErrorBoundary>
			<React.Suspense fallback={<Loading/>}>
				<Header/>
				<LeftAndMain>
					<React.Suspense fallback={<Loading/>}>
						<RouteController/>
					</React.Suspense>
				</LeftAndMain>
			</React.Suspense>
		</ErrorBoundary>,
		document.getElementById("app")
	)
}

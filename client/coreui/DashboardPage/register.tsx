import React from "react";

import { RegisterRoute } from "client/router/RouterController/RouterController";

RegisterRoute({
	path: "/dashboard",
	component: React.lazy(() => import("client/coreui/DashboardPage/DashboardPage")),
})

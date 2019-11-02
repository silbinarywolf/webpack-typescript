import React from "react";

import { RegisterRoute } from "client/routes";

RegisterRoute({
	path: "/dashboard",
	component: React.lazy(() => import("client/coreui/DashboardPage/DashboardPage")),
})

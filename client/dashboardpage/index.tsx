import React from "react";

import { routes } from "client/routes";

routes.RegisterRoute({
	path: "/dashboard",
	component: React.lazy(() => import("./DashboardPage")),
})

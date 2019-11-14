import React from "react";

import { routes } from "client/routes";

routes.SetFallbackRoute({
	path: '',
	component: React.lazy(() => import("./ErrorPage")),
});

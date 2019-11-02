import React from "react";

import { SetFallbackRoute } from "client/routes";

SetFallbackRoute({
	path: '',
	component: React.lazy(() => import("client/errorpage/ErrorPage/ErrorPage")),
});

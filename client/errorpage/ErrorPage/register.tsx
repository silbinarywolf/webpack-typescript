import React from "react";

import { RegisterRoute } from "client/router/RouterController/RouterController";

RegisterRoute({
	component: React.lazy(() => import("client/errorpage/ErrorPage/ErrorPage")),
});

import React from "react";

import { RegisterRoute } from "client/routes";

export const ListPagePath = "/data/:model";

export const ListPage = React.lazy(() => import("client/editrecord/ListPage/ListPage"));

RegisterRoute({
	path: ListPagePath,
	component: ListPage,
});

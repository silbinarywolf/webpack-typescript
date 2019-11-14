import React from "react";

import { routes } from "client/routes";

export const ListPagePath = "/data/:model";

export const ListPage = React.lazy(() => import("client/editrecord/ListPage/ListPage"));

routes.RegisterRoute({
	path: ListPagePath,
	component: ListPage,
});

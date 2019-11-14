import React from "react";

import { routes } from "client/routes";

const URLPrefix = "/data/:model";

export const EditPageURL = URLPrefix + "/edit/:id";

const EditPage = React.lazy(() => import("client/editrecord/EditPage/EditPage"));

routes.RegisterRoute({
	path: URLPrefix + "/add",
	params: {
		id: "0",
	},
	component: EditPage,
});

routes.RegisterRoute({
	path: EditPageURL,
	component: EditPage,
});

import React from "react";

import { RegisterRoute } from "client/routes";

const URLPrefix = "/data/:model";

export const EditPageURL = URLPrefix + "/edit/:id";

const EditPage = React.lazy(() => import("client/editrecord/EditPage/EditPage"));

RegisterRoute({
	path: URLPrefix + "/add",
	params: {
		id: "0",
	},
	component: EditPage,
});

RegisterRoute({
	path: EditPageURL,
	component: EditPage,
});

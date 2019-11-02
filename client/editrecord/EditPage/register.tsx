import React from "react";

import { RegisterRoute } from "client/routes";

const BasePath = "/data/:model";

export const EditPagePath = BasePath + "/edit/:id";

const EditPage = React.lazy(() => import("client/editrecord/EditPage/EditPage"));

RegisterRoute({
	path: BasePath + "/add",
	params: {
		id: "0",
	},
	component: EditPage,
});

RegisterRoute({
	path: EditPagePath,
	component: EditPage,
});

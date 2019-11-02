import React from "react";

import { RegisterRoute } from "client/routes";

export const EditPagePath = "/edit/:model/:id";

const Component = React.lazy(() => import("client/editrecord/EditPage/EditPage"));

RegisterRoute({
	path: "/add/:model",
	params: {
		id: "0",
	},
	component: Component,
});

RegisterRoute({
	path: EditPagePath,
	component: Component,
});

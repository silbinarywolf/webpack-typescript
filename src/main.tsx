import React from "react";
import ReactDOM from "react-dom";

import "~/main.css";
import { Header } from "~/Header/Header";
import { Container } from "~/Container/Container";
import { Button } from "~/Button/Button";

function main() {
	ReactDOM.render(
		<React.Fragment>
			<Header/>
			<Container>
			    <Button
			    	label="Test Button"
			    />
		    </Container>
	    </React.Fragment>,
	    document.getElementById("app")
	);
}
main();

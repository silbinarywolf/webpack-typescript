import React from "react";

import styles from "client/coreui/LeftAndMain/LeftAndMain.css";

interface Props {
}

export function LeftAndMain(props: React.PropsWithChildren<Props>): JSX.Element {
	const {
		children,
	} = props;
	return (
		<React.Fragment>
			<div className={styles.menuBack}/>
			<div className={styles.menu}>
				<ul className={styles.menuList}>
					<li>
						<a
							href="#"
							className={styles.menuLink}
						>
							Pages
						</a>
					</li>
				</ul>
			</div>
			<div
				className={styles.layout}
			>
				{children}
			</div>
		</React.Fragment>
	)
}

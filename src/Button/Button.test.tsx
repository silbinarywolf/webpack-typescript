// Link.react.test.js
import React from 'react';
import { Button } from './Button';
import renderer from 'react-test-renderer';

test('Link changes the class when hovered', () => {
	const component = renderer.create(
		<Button label="Click"/>,
	);
	let tree = component.toJSON();
	expect(tree).toMatchSnapshot();
});

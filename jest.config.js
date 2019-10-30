module.exports = {
	verbose: true,
	moduleFileExtensions: ["js", "ts", "tsx"],
	moduleDirectories: ["node_modules"],
	moduleNameMapper: {
		"client(.*)": "<rootDir>/client/$1",
		"\\.css$": "identity-obj-proxy",
		"\\.(gif|ttf|eot|svg)$": "<rootDir>/__mocks__/fileMock.js"
	},
	transform: {
		"^.+\\.tsx?$": "ts-jest"
	},
};

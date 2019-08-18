const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	entry: path.resolve(__dirname, 'src/main.tsx'),
	mode: 'production',
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: require.resolve('css-modules-typescript-loader'),
						options: {
							mode: process.env.CI ? 'verify' : 'emit'
						}
					},
					{
						loader: require.resolve('css-loader'),
						options: {
							modules: true,
						},
					},
					/*{
						loader: require.resolve('postcss-loader')
					}*/
				],
			},
		]
	},
	resolve: {
		extensions: [
			'.tsx',
			'.ts',
			'.js',
		],
		plugins: [
			new TsconfigPathsPlugin()
		]
	},
	output: {
		filename: 'bundle.min.js',
		path: path.resolve(__dirname, 'dist')
	},
	devServer: {
		contentBase: path.join(__dirname, 'dist'),
		compress: true,
		port: 9000,
	}
};

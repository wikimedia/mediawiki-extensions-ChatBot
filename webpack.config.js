const path = require( 'path' );

module.exports = {
	mode: 'production',
	entry: {
		chatbot: './resources/ts/ChatBot.ts'
	},
	output: {
		path: path.resolve( __dirname, 'resources/js/dist' ),
		filename: 'hallowelt.[name].bundle.js'
	},
	resolve: {
		extensions: ['.ts', '.js', '.json']
	},
	module: {
		rules: [{
			test: /\.ts?$/,
			exclude: /node_modules/,
			loader: 'ts-loader'
		}],
	},
	watchOptions: {
		// for some systems, watching many files can result in a lot of CPU or memory usage
		// https://webpack.js.org/configuration/watch/#watchoptionsignored
		// don't use this pattern, if you have a monorepo with linked packages
		ignored: /node_modules/
	}
};

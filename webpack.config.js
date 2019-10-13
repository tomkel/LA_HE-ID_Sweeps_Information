const path = require('path')
const Dotenv = require('dotenv-webpack')

module.exports = {
  entry: {
    main: './src/main.js',
    'pdf.worker': 'pdfjs-dist/build/pdf.worker.entry',
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    publicPath: '/',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        use: {
          loader: 'elm-webpack-loader',
          options: {
            pathToElm: 'node_modules/elm/bin/elm',
          },
        },
      },
    ],
  },
  plugins: [new Dotenv()],
}

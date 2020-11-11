const path = require('path');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: false,
    compress: true,
    port: 8000
  },
  entry: {
    app: path.resolve(__dirname, 'js', 'bootstrap.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'docs'),
  },
  plugins: [
    new WasmPackPlugin({
        crateDirectory: path.resolve(__dirname),
        outDir: path.resolve(__dirname, 'target', 'pkg'),
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Demoloops',
    }),
  ],
  experiments: {
    syncWebAssembly: true,
    // asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },
};
const path = require("path");
const nodeExternals = require("webpack-node-externals");
module.exports = {
  mode: "production", //mode: "development",
  entry: {
    index: "./src/index.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "."),
  },
  target: "node",
  externals: [nodeExternals()],
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        loader: "ts-loader",
        test: /\.ts$/,
        exclude: [/node_modules/],
        options: { configFile: "tsconfig.json" },
      },
    ],
  },
  resolve: { extensions: [".ts", ".js"] },
};

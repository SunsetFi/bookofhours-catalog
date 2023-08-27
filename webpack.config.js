"use strict";
const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");

const isDev = process.env["NODE_ENV"] === "development";

const root = path.resolve(__dirname);

const paths = {
  appRoot: root,
  appPackageJson: path.resolve(root, "package.json"),
  appSrc: path.resolve(root, "./src"),
  appPublic: path.resolve(root, "./public"),
  publicPath: "/",
};

console.log("Webpack build", isDev ? "[development]" : "[production]");

module.exports = {
  mode: isDev ? "development" : "production",

  devtool: "source-map",

  devServer: {
    hot: isDev,
    historyApiFallback: true,
  },

  entry: {
    client: [path.join(paths.appSrc, "./index.tsx")],
  },

  output: {
    filename: "[name].[fullhash].bundle.js",
    path: paths.appPublic,
    publicPath: isDev ? "/" : paths.publicPath,
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    alias: {
      "@": paths.appSrc,
    },
  },

  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(jsx?|tsx?)$/,
        loader: "source-map-loader",
      },

      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.join(paths.appRoot, "tsconfig.json"),
              projectReferences: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },

      {
        test: /\.(png|webp)$/,
        type: "asset/resource",
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(paths.appSrc, "index.ejs"),
      minify: false,
    }),
  ].filter((x) => x),

  optimization: {
    splitChunks: {
      chunks: "all",
    },
    runtimeChunk: true,
    minimize: !isDev,
  },

  ignoreWarnings: [/Failed to parse source map/],
};

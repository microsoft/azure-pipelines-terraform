const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  
  return {
    entry: "./src/index.tsx",
    output: {
      filename: "app.js",
      path: path.resolve(__dirname, "dist")
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: [
            "style-loader",
            "css-loader",
            "sass-loader"
          ]
        },
        {
          test: /\.css$/,
          use: [
            "style-loader", 
            "css-loader"
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html"
      })
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "dist")
      },
      port: 3000,
      hot: true
    }
  };
};

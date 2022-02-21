const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production',
    entry: {
        temp: './temp.js',
    },
    output: {
        path: __dirname + '/build',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "./images", to: "images", context: "." },
                { from: "./overview.md", to: "overview.md" },
                { from: "./azure-devops-extension.json", to: "azure-devops-extension.json" },
                {
                    from: "./Tasks",
                    globOptions: {
                        dot: true,
                        gitignore: false,
                        ignore: ["**/Tests/**","**/*.ts"],
                    },
                    to: "Tasks"
                },

            ]
        })
    ]
};
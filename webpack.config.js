const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        temp: './temp.js',
    },
    output: {
        path: __dirname + '/build'
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                exclude: [
                    /node_modules/,  // Skip all node_modules
                ],
                terserOptions: {
                    parse: {
                        ecma: 2020,
                    },
                    compress: false,  // Faster builds, less risky
                    mangle: false,    // Preserve names for debugging
                },
            }),
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "./images", to: "images", context: "." },
                { from: "./overview.md", to: "overview.md" },
                { from: "./LICENSE", to: "./" },
                { from: "./azure-devops-extension.json", to: "azure-devops-extension.json" },
                {
                    from: "./Tasks",
                    globOptions: {
                        dot: true,
                        gitignore: false,
                        ignore: ["**/Tests/**", "**/*.ts"],
                    },
                    to: "Tasks"
                },
                {
                    // Lives outside Tasks/ because that tree is uploaded as the task payload
                    // agents download, and this bundle is browser-only. The destination must
                    // match the `files` entry and contribution uri in azure-devops-extension.json.
                    from: "./views/terraform-plan/dist",
                    to: "views/terraform-plan/dist"
                },

            ]
        })
    ]
};
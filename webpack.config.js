
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = smp.wrap({
    entry: path.join(__dirname, "src/js/index.js"),

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[contenthash].js",
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src/html/index.html"),
        }),
    ],

    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-react'],
                },
            },
        }, {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
        }, {
            test: /\.(png|svg|jpg|jpeg|gif)$/i,
            type: 'asset/resource',
        }],
    },

    mode: 'production',
});
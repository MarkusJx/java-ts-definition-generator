import path from 'path';
import { BannerPlugin } from 'webpack';
import nodeExternals from 'webpack-node-externals';

interface AdditionalOptions {
    banner?: string;
}

const config = (
    entry: string,
    mode: string,
    outName: string,
    opts?: AdditionalOptions
) => ({
    entry,
    target: 'node',
    mode,
    externalsPresets: {
        node: true,
    },
    externals: [nodeExternals()],
    output: {
        path: path.join(__dirname, 'dist'),
        filename: outName,
        library: {
            name: 'java',
            type: 'umd',
        },
    },
    node: {
        __dirname: false,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.node$/,
                loader: 'node-loader',
                options: {
                    name: '[path][name].[ext]',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devtool: 'source-map',
    plugins: [
        opts?.banner &&
            new BannerPlugin({
                banner: opts?.banner,
                raw: true,
            }),
    ].filter((v) => !!v),
});

module.exports = [
    config('./src/index.ts', 'production', 'index.prod.min.js'),
    config('./src/cli.ts', 'production', 'java-ts-gen.js', {
        banner: '#!/usr/bin/env node',
    }),
];

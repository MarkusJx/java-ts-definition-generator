import path from 'path';
import { BannerPlugin } from 'webpack';
import nodeExternals from 'webpack-node-externals';
import CopyPlugin from 'copy-webpack-plugin';

module.exports = {
    entry: {
        index: {
            import: './src/index.ts',
            filename: 'index.prod.min.js',
            library: {
                name: 'java-ts-definition-generator',
                type: 'umd',
            },
        },
        cliWorker: {
            import: './src/worker/cliWorker.ts',
            filename: 'cliWorker.js',
        },
        cli: {
            import: './src/cli.ts',
            filename: 'java-ts-gen.js',
        },
    },
    target: 'node16',
    mode: 'production',
    externalsPresets: {
        node: true,
    },
    externals: [nodeExternals()],
    output: {
        path: path.join(__dirname, 'dist'),
        clean: true,
    },
    node: {
        __dirname: false,
        __filename: true,
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
        new BannerPlugin({
            banner: '#!/usr/bin/env node',
            raw: true,
            include: 'java-ts-gen.js',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: './java-src/build/libs/ASTGenerator-*.jar',
                    to: 'ASTGenerator.jar',
                },
            ],
        }),
    ],
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
};

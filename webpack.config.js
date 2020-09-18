const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const Sass = require('sass');

const isProduction = process.env.NODE_ENV == 'production';
const isDevelopment = !isProduction;

const PATHS = {
  entryPoint: path.resolve(__dirname, 'src/index.ts'),
  bundles: path.resolve(__dirname, 'dist'),
};

module.exports = {
  entry: {
    index: PATHS.entryPoint,
  },
  target: 'web',
  output: {
    filename: '[name].[contenthash].js',
    path: PATHS.bundles,
  },
  devtool: isDevelopment ? 'source-map' : '',
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserJSPlugin({
        sourceMap: true,
        test: /\.js$/i,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      xhtml: true,
      template: './src/index.html',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
      inlineSource: '.(js|css)$',
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].[contenthash].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              implementation: Sass,
            },
          },
        ],
      },
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
        },
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};

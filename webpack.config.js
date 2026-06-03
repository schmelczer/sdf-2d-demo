const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const HTMLInlineCSSWebpackPlugin =
  require('html-inline-css-webpack-plugin').default;

const PATHS = {
  entryPoint: path.resolve(__dirname, 'src/index.ts'),
  entryHtml: path.resolve(__dirname, 'src/index.html'),
  bundles: path.resolve(__dirname, 'dist'),
};

// Inline the UI SVGs referenced via <img src> into the HTML (replacing the
// abandoned html-webpack-inline-svg-plugin). Scope html-loader to <img src> so
// the favicon <link href> tags are left to resolve against the emitted files.
const htmlLoaderOptions = JSON.stringify({
  sources: { list: [{ tag: 'img', attribute: 'src', type: 'src' }] },
  minimize: false,
});

module.exports = {
  entry: {
    index: PATHS.entryPoint,
  },
  target: 'web',
  output: {
    path: PATHS.bundles,
    // The bundle is inlined into index.html (no <script src>), so webpack 5's
    // default publicPath:'auto' cannot derive a path from document.currentScript
    // and throws "Automatic publicPath is not supported". A static value (assets
    // sit next to index.html at the dist root) avoids the runtime auto-detection.
    publicPath: '',
    clean: true,
  },
  //devtool: 'source-map',
  watchOptions: {
    aggregateTimeout: 600,
    ignored: /node_modules/,
  },
  devServer: {
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      xhtml: true,
      template: `!!html-loader?${htmlLoaderOptions}!${PATHS.entryHtml}`,
      // The bundle gets inlined, and `defer` is ignored on inline <script>s, so
      // it must sit at the end of <body> (not head) to run after the DOM exists.
      inject: 'body',
      scriptLoading: 'blocking',
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlInlineScriptPlugin(),
    new HTMLInlineCSSWebpackPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        // transpileOnly mirrors the project's prior de-facto behaviour: the old
        // ts-config-webpack-plugin ran type-checking in a separate fork-ts-checker
        // process that crashes on Node 22, so types were never actually enforced.
        // (`npm run lint` still type-aware-lints; full type-checking can be
        // re-enabled separately once the pre-existing type errors are addressed.)
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
        },
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          // resolve-url-loader v5 always retains the query/hash (the old
          // `keepQuery` option was removed), so no options are needed.
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              implementation: require('sass'),
            },
          },
        ],
      },
      {
        // Favicons, og-image, 404.html and robots.txt: emit verbatim to the
        // dist root (imported for their side effect in src/index.ts).
        // sideEffects:true keeps these bare imports from being tree-shaken away
        // under the package's "sideEffects": ["*.scss"] declaration.
        test: /no-change.*$/i,
        type: 'asset/resource',
        sideEffects: true,
        generator: {
          filename: '[name][ext]',
        },
      },
      {
        test: /\.svg$/,
        type: 'asset/inline',
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: ['source-map-loader'],
      },
    ],
  },
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
};

// NOTE: Don't use this config by itself! It is just a parent for the dev and production configs.

const _ = require('lodash')
const path = require('path')
const webpack = require('webpack')
const moment = require('moment')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
require('moment/min/locales.min')
const glob = require('glob')
require('coffee-script')
require('coffee-script/register')
const product = process.env.COCO_PRODUCT || 'codecombat'
const shaTag = process.env.GIT_SHA || 'dev'
const productSuffix = { codecombat: 'coco', ozaria: 'ozar' }[product]
require.extensions[`.${productSuffix}.coffee`] = require.extensions['.coffee']
const CompileStaticTemplatesPlugin = require('./compile-static-templates')
const { VueLoaderPlugin } = require('vue-loader')
const PWD = process.env.PWD || __dirname
const fs = require('fs')
const { publicFolderName } = require('./development/utils')
const locale = require('./app/locale/locale')
const localeKeys = Object.keys(locale)
const possibleLocaleKeysFn = (keys) => {
  const current = [...keys]
  keys.forEach((key) => {
    if (key.includes('-')) {
      const langs = {
        'zh-HANS': 'zh-cn',
        'zh-HANT': 'zh-tw'
      }
      if (langs[key]) {
        current.push(langs[key])
      }
      const possible = key.split('-')
      const temp = []
      for (let i = 0; i < possible.length - 1; i++) {
        temp.push(possible[i])
        current.push(temp.join('-'))
      }
    }
  })
  return current
}
const possibleLocaleKeys = possibleLocaleKeysFn(localeKeys)
const momentCocoLocales = _.intersection(possibleLocaleKeys, moment.locales())

console.log(`Starting Webpack for product ${product}`)

class ProductResolverPlugin {
  // Imports foo.coco.bar, foo.ozar.bar, or foo.bar as appropriate
  apply(resolver) {
    resolver.ensureHook(this.target)

    resolver
      .getHook("undescribed-raw-file")
      .tapAsync('ProductResolver', (request, ctx, cb) => {
	cb()
      })

    resolver
      .getHook("resolveStep")
      .tap('ProductResolver', function(hook, request) {
        if (/node_modules/.test(request.path)) return

        if (!request.relativePath) return

        if (/\.import\.(sass|scss)$/.test(request.path)) {
          request.path = request.path.replace(/\.import\.(sass|scss)/, `.${productSuffix}.$1`)
          return
        }

        let match = request.path.match(new RegExp(`([a-z]+)\\.${productSuffix}\\.\\1$`))
        if (!match) return
        let fixed = request.path.substr(0, match.index) + productSuffix + '.' + match[1]
        request.path = fixed
      })
  }
}

// Main webpack config
module.exports = (env) => {
  if (!env) env = {}

  // Configure optional node_modules/ai/dist requires
  const aiDistPath = path.resolve(PWD, 'node_modules/ai/dist')
  const extraCopyWebpackPluginPatterns = []
  const extraIgnorePluginEntries = []
  if (fs.existsSync(aiDistPath)) {
    extraCopyWebpackPluginPatterns.push({
      // Standalone ai project expects images and other assets to be in its public folder, so copy them to AI's new root `/ai`
      context: aiDistPath,
      from: '**/*',
      to: 'ai'
    })
  } else {
    extraIgnorePluginEntries.push(new webpack.IgnorePlugin({
      resourceRegExp: /node_modules\/ai\/dist\/(ai|style)/
    }))
  }

  return {
    context: path.resolve(PWD),
    entry: {
      // NOTE: If you add an entrypoint, consider updating ViewLoadTimer to track its loading.
      app: './app/app.js',
      world: glob.sync('./app/lib/world/**/*.*').concat([ // For worker_world
        './app/lib/worldLoader',
        './app/core/CocoClass',
        './app/core/utils',
        './vendor/scripts/string_score.js',
        './bower_components/underscore.string',
        './vendor/scripts/coffeescript.js'
      ]),
      lodash: 'lodash', // For worker_world
      aether: './app/lib/aether/aether' // For worker_world
      // esper: './bower_components/esper.js/esper.js',
      // vendor: './app/vendor.js'
    },
    output: {
      filename: 'javascripts/[name].js', // TODO: Use chunkhash in layout.static.pug's script tags instead of GIT_SHA
      // chunkFilename is determined by build type
      path: path.resolve(PWD, publicFolderName),
      publicPath: '/' // Base URL path webpack tries to load other bundles from
    },
    devtool: 'eval-cheap-source-map',
    module: {
      noParse: function (name) { // These are already built into commonjs bundles
        return _.any([
          /vendor.*coffeescript/,
          /bower_components.*aether/,
          /fuzzaldrin/
        ], (regex) => { return regex.test(name) })
      },
      rules: [
        { test: require.resolve('cookieconsent'), use: 'exports-loader?cookieconsent' },
        { test: /\.vue$/, use: [{ loader: 'vue-loader' }] },
        { test: /vendor\/scripts\/async.js/, use: [ { loader: 'imports-loader?root=>window' } ] },
        {
          test: /\.worker\.(c|m)?js$/i,
          loader: "worker-loader",
          options: {
            esModule: false,
          },
        },
        { test: /\.js$/,
          exclude: /(node_modules|bower_components|vendor)/,
          use: [{
            loader: 'babel-loader',
            options: {
              cacheDirectory: true
            }
          }]
        },
        { test: /\.coffee$/,
          use: [
            { loader: 'coffee-loader' }
          ] },
        { test: /\.pug$/,
          oneOf: [
            // applies to <template lang="pug"> in Vue components
            {
              resourceQuery: /^\?vue/,
              //use: ['pug-plain-loader']
              use: ['vue-pug-loader']
            },
            // applies to all other pug imports
            {
              use: { loader: 'pug-loader', options: { root: path.resolve('./app') } }
            }
          ]
        },
        {
          oneOf: [
            { test: /jquery-ui.*css$/,
              use: [ // So we can ignore the images it references that we are missing
                { loader: 'style-loader' },
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    esModule: false
                  }
                },
                { loader: 'css-loader', options: { url: false } }
              ] },
            { test: /\.css$/,
              use: [
                { loader: 'style-loader' },
                {
                  loader: MiniCssExtractPlugin.loader,
                  options: {
                    esModule: false
                  }
                },
                {
                  loader: 'css-loader',
                  options: {
                    url: false
                  }
                },
              ] }
          ]
        },
        { test: /\.sass$/,
          use: [
            'vue-style-loader',
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false
              }
            },
            {
              loader: 'css-loader',
              options: {
                url: false
              }
            },
            {
              loader: 'sass-loader',
              options: {
                implementation: require("sass"),
                sassOptions: {
                  indentedSyntax: true,
                },
                additionalData: `$is-codecombat: ${product == 'codecombat'}`,
              }
            },
            { loader: 'import-glob-loader' }
          ]
        },
        { test: /\.scss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: false
              }
            },
            {
              loader: 'css-loader',
              options: {
                url: false
              }
            },
            {
              loader: 'sass-loader',
              options: {
                implementation: require("sass"),
                additionalData: `$is-codecombat: ${product == 'codecombat'};`,
              }
            }
          ]
        },
        {
          test: /\.mjs$/, // https://github.com/formatjs/formatjs/issues/1395#issuecomment-518823361
          include: /node_modules/,
          type: "javascript/auto"
        }
      ]
    },
    resolve: {
      modules: [ // This section denotes what folders you can use as a root in a require statement
        path.resolve('./app'), // eg require('vendor.js') gets /app/vendor.js
        path.resolve('./app/assets'), // eg require('images/favicon/favicon.ico') gets /app/assets/images/favicon/favicon.ico
        path.resolve('./'), // Or you can use the full path /app/whatever
        'node_modules' // Or maybe require('foo') for the Node module "foo".
      ],
      extensions: [
        '.web.coffee', '.web.js', '.coffee', '.js', '.pug', '.sass', '.vue',
        `.${productSuffix}.coffee`, `.${productSuffix}.js`, `.${productSuffix}.pug`, `.${productSuffix}.sass`, `.${productSuffix}.vue`,  //, `.${productSuffix}.scss` ?
      ],
      alias: { // Replace Backbone's underscore with lodash
        'underscore': 'lodash',
        'ace-builds': path.resolve(__dirname, 'bower_components/ace-builds') //y-ace requires
      },
      // https://github.com/facebook/create-react-app/issues/11756#issuecomment-1047253186
      fallback: {
        util: require.resolve('util/'), // because of 'console-browserify' package used by jshint, details: https://github.com/facebook/create-react-app/issues/11756
        assert: require.resolve('assert/'), // because of 'console-browserify'
        'process/browser': require.resolve('process/browser') // because of Yjs
      },
      plugins: [new ProductResolverPlugin()]
    },
    externals: {
      'esper.js': 'esper'
    },
    plugins: [
      new webpack.DefinePlugin({
        "COCO_PRODUCT": JSON.stringify(product), // Has to stringify
        "SHA_TAG": JSON.stringify(shaTag)
      }),
      new webpack.ProgressPlugin({ profile: false }), // Always show build progress
      new MiniCssExtractPlugin({ // Move CSS into external file
        filename: 'stylesheets/[name].css',
        chunkFilename: 'stylesheets/[name]-[contenthash].css',
        ignoreOrder: true, // too many conflict warnings because of TestView, ignoring till those conflicts are fixed or that route is disabled
      }),
      new webpack.ProvidePlugin({ // So Bootstrap can use the global jQuery
        $: 'jquery',
        jQuery: 'jquery',
        application: path.resolve(PWD, 'app/core/application')
      }),
      new webpack.IgnorePlugin({ resourceRegExp: /\/fonts\/bootstrap\/.*$/ }), // Ignore Bootstrap's fonts
      new webpack.IgnorePlugin({ resourceRegExp: /^memwatch$/ }), // Just used by the headless client on the server side
      new webpack.IgnorePlugin({ resourceRegExp: /.DS_Store$/ }),
      new webpack.IgnorePlugin({ contextRegExp: /blockly\/msg/, resourceRegExp: /.d\.ts$/ }),

      new CopyWebpackPlugin({
        patterns: [
          // NOTE: If you add a static asset, consider updating ViewLoadTimer to track its loading.
          { // Static assets
            // Let's use file-loader down the line, but for now, just use URL references.
            from: 'app/assets',
            to: '.'
          }, { // Ace
            context: 'bower_components/ace-builds/src-min-noconflict',
            from: '**/*',
            to: 'javascripts/ace'
          }, { // Esper
            from: 'bower_components/esper.js/esper.js',
            to: 'javascripts/esper.js'
          }, {
            from: 'bower_components/esper.js/esper-modern.js',
            to: 'javascripts/esper.modern.js'
          }, {
            from: 'vendor/esper-plugin-lang-java-modern.js',
            to: 'javascripts/app/vendor/aether-java.modern.js'
          }, {
            from: 'vendor/esper-plugin-lang-cpp-modern.js',
            to: 'javascripts/app/vendor/aether-cpp.modern.js'
          }
        ].concat(extraCopyWebpackPluginPatterns)
      }),
      new CompileStaticTemplatesPlugin({
        locals: { shaTag: process.env.GIT_SHA || 'dev', chinaInfra: process.env.COCO_CHINA_INFRASTRUCTURE || false }
      }),
      new VueLoaderPlugin(),
      new webpack.ProvidePlugin({
        process: 'process/browser', // because of algoliasearch which needs access to process: https://github.com/algolia/docsearch/issues/980
        Buffer: ['buffer', 'Buffer']
      }),
      new MomentLocalesPlugin({
        localesToKeep: momentCocoLocales
      })
    ].concat(extraIgnorePluginEntries),
    optimization: {},
    stats: 'minimal'
  }
}

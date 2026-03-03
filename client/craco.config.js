const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const constants = require('./src/constants/constants.node');

const gtagId = constants.TRACKING.GTAG_ID;
const tagline = process.env.REACT_APP_TAGLINE || '(donation capital)';

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress websocket ping errors in development
      if (process.env.NODE_ENV === 'development') {
        webpackConfig.infrastructureLogging = {
          level: 'error',
        };
      }
      // Suppress http-proxy-middleware logs by configuring devServer
      if (webpackConfig.devServer) {
        // Remove deprecated middleware hooks to suppress warnings
        delete webpackConfig.devServer.onBeforeSetupMiddleware;
        delete webpackConfig.devServer.onAfterSetupMiddleware;
      }
      // Ensure TypeScript extensions are resolved
      webpackConfig.resolve.extensions = [
        ...webpackConfig.resolve.extensions,
        '.ts',
        '.tsx',
      ];
      // Add path resolution for TypeScript aliases
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@Components': path.resolve(__dirname, 'src/components'),
        '@Hooks': path.resolve(__dirname, 'src/hooks'),
        '@CONSTANTS': path.resolve(__dirname, 'src/constants'),
        '@Tuples': path.resolve(__dirname, 'src/tuples'),
        '@Contexts': path.resolve(__dirname, 'src/contexts'),
        '@Utils': path.resolve(__dirname, 'src/utils'),
        '@API': path.resolve(__dirname, 'src/api'),
        '@Interfaces': path.resolve(__dirname, 'src/interfaces'),
        '@Types': path.resolve(__dirname, 'src/types'),
        '@Pages': path.resolve(__dirname, 'src/pages'),
        '@Shared': path.resolve(__dirname, '../shared'),
      };

      // Add shared directory to module resolution so webpack can find it
      if (!webpackConfig.resolve.modules) {
        webpackConfig.resolve.modules = ['node_modules'];
      }
      if (
        !webpackConfig.resolve.modules.includes(
          path.resolve(__dirname, '../shared')
        )
      ) {
        webpackConfig.resolve.modules.push(
          path.resolve(__dirname, '../shared')
        );
      }

      // Remove ModuleScopePlugin restriction to allow imports from shared directory
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ModuleScopePlugin'
      );

      // Configure babel-loader to transpile CommonJS modules from shared directory
      const sharedPath = path.resolve(__dirname, '../shared');

      // Find the oneOf rule that contains babel-loader
      const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
      if (oneOfRule && oneOfRule.oneOf) {
        oneOfRule.oneOf.forEach((rule) => {
          if (
            rule.test &&
            rule.test.toString().includes('js') &&
            rule.use &&
            Array.isArray(rule.use)
          ) {
            const babelLoader = rule.use.find(
              (use) => use.loader && use.loader.includes('babel-loader')
            );
            if (babelLoader) {
              // Add shared directory to babel-loader include paths
              if (rule.include) {
                if (Array.isArray(rule.include)) {
                  if (!rule.include.includes(sharedPath)) {
                    rule.include.push(sharedPath);
                  }
                } else {
                  rule.include = [rule.include, sharedPath];
                }
              } else {
                rule.include = [sharedPath];
              }
            }
          }
        });
      }

      // Configure CSS loader to ignore absolute paths (public assets)
      if (oneOfRule && oneOfRule.oneOf) {
        oneOfRule.oneOf.forEach((rule) => {
          if (
            rule.test &&
            (rule.test.toString().includes('css') ||
              rule.test.toString().includes('\\.css$'))
          ) {
            if (rule.use && Array.isArray(rule.use)) {
              const cssLoader = rule.use.find(
                (use) =>
                  use.loader &&
                  (use.loader.includes('css-loader') ||
                    (typeof use === 'string' && use.includes('css-loader')))
              );
              if (cssLoader && cssLoader.options) {
                // Configure css-loader to not process URLs starting with /
                const originalUrl = cssLoader.options.url;
                cssLoader.options.url = {
                  filter: (url, resourcePath) => {
                    // Don't process absolute paths (public assets)
                    if (url.startsWith('/')) {
                      return false;
                    }
                    // Use original filter if it exists
                    if (
                      originalUrl &&
                      typeof originalUrl === 'object' &&
                      originalUrl.filter
                    ) {
                      return originalUrl.filter(url, resourcePath);
                    }
                    // Default: process the URL
                    return true;
                  },
                };
              }
            }
          }
        });
      }

      webpackConfig.plugins.push(
        new (class {
          constructor(trackingId, taglineValue) {
            this.trackingId = trackingId;
            this.taglineValue = taglineValue;
          }
          apply(compiler) {
            compiler.hooks.compilation.tap(
              'ReplaceHtmlPlaceholders',
              (compilation) => {
                const hooks = HtmlWebpackPlugin.getHooks(compilation);

                hooks.afterTemplateExecution.tapAsync(
                  'ReplaceHtmlPlaceholders',
                  (data, callback) => {
                    if (data && data.html && typeof data.html === 'string') {
                      data.html = data.html.replace(
                        /%GTAG_ID%/g,
                        this.trackingId
                      );
                      data.html = data.html.replace(
                        /%TAGLINE%/g,
                        this.taglineValue
                      );
                    }
                    callback(null, data);
                  }
                );

                hooks.beforeEmit.tapAsync(
                  'ReplaceHtmlPlaceholders',
                  (data, callback) => {
                    if (data && data.html && typeof data.html === 'string') {
                      data.html = data.html.replace(
                        /%GTAG_ID%/g,
                        this.trackingId
                      );
                      data.html = data.html.replace(
                        /%TAGLINE%/g,
                        this.taglineValue
                      );
                    }
                    callback(null, data);
                  }
                );
              }
            );

            // Also use emit hook as fallback
            compiler.hooks.emit.tapAsync(
              'ReplaceHtmlPlaceholders',
              (compilation, callback) => {
                Object.keys(compilation.assets).forEach((filename) => {
                  if (filename.endsWith('.html')) {
                    const asset = compilation.assets[filename];
                    let source = asset.source();
                    if (typeof source === 'string') {
                      source = source.replace(/%GTAG_ID%/g, this.trackingId);
                      source = source.replace(/%TAGLINE%/g, this.taglineValue);
                      compilation.assets[filename] = {
                        source: () => source,
                        size: () => source.length,
                      };
                    }
                  }
                });
                callback();
              }
            );
          }
        })(gtagId, tagline)
      );

      return webpackConfig;
    },
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer || !devServer.app) {
        return middlewares;
      }

      // Add middleware to modify HTML responses from webpack dev server
      devServer.app.use((req, res, next) => {
        const originalSend = res.send;
        res.send = function (body) {
          if (
            typeof body === 'string' &&
            res.getHeader('content-type')?.includes('text/html')
          ) {
            if (body.includes('%GTAG_ID%') || body.includes('%TAGLINE%')) {
              body = body
                .replace(/%GTAG_ID%/g, gtagId)
                .replace(/%TAGLINE%/g, tagline);
            }
          }
          return originalSend.call(this, body);
        };
        next();
      });

      return middlewares;
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '^@Components/(.*)$': path.resolve(__dirname, 'src/components/$1'),
        '^@Hooks/(.*)$': path.resolve(__dirname, 'src/hooks/$1'),
        '^@CONSTANTS/(.*)$': path.resolve(__dirname, 'src/constants/$1'),
        '^@CONSTANTS$': path.resolve(__dirname, 'src/constants'),
        '^@Tuples/(.*)$': path.resolve(__dirname, 'src/tuples/$1'),
        '^@Contexts/(.*)$': path.resolve(__dirname, 'src/contexts/$1'),
        '^@Contexts$': path.resolve(__dirname, 'src/contexts'),
        '^@Utils/(.*)$': path.resolve(__dirname, 'src/utils/$1'),
        '^@Utils$': path.resolve(__dirname, 'src/utils'),
        '^@API/(.*)$': path.resolve(__dirname, 'src/api/$1'),
        '^@API$': path.resolve(__dirname, 'src/api'),
        '^@Interfaces/(.*)$': path.resolve(__dirname, 'src/interfaces/$1'),
        '^@Types/(.*)$': path.resolve(__dirname, 'src/types/$1'),
        '^@Pages/(.*)$': path.resolve(__dirname, 'src/pages/$1'),
        '^@Pages$': path.resolve(__dirname, 'src/pages'),
        '^@Shared$': path.resolve(__dirname, '../shared'),
      },
    },
  },
};

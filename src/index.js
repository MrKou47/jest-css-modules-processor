
const { assign, identity } = require('lodash');
const path = require('path');
const { readFileSync } = require('fs');

const genericNames = require('generic-names');

const postcss = require('postcss');

// postcss plugins
const Scope = require('postcss-modules-scope');
const Values = require('postcss-modules-values');
const LocalByDefault = require('postcss-modules-local-by-default');
const ExtractImports = require('postcss-modules-extract-imports');
const ResolveImports = require('postcss-modules-resolve-imports');

const { transformTokens } = require('./transformTokens');

const renderModule = tokens => `
  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = ${JSON.stringify(tokens)};
  module.exports = exports.default;
`;

module.exports = {
  process(code, filePath) {
    const ext = path.extname(filePath).slice(1);
    // eslint-disable-next-line
    const config = require(path.resolve('package.json')).jestCSSProcessor;
    const {
      camelCase,
      devMode,
      preprocessCss = identity,
      processCss,
      processorOpts,
      createImportedName,
      generateScopedName,
      hashPrefix,
      mode,
      resolve: resolveOpts,
      rootDir: context = process.cwd(),
    } = config;
      // validate(arguments[0]);

    const tokensByFile = {};

    // debug option is preferred NODE_ENV === 'development'
    const debugMode = typeof devMode !== 'undefined'
      ? devMode
      : process.env.NODE_ENV === 'development';

    let scopedName;

    if (generateScopedName) {
      scopedName = typeof generateScopedName !== 'function'
        ? genericNames(generateScopedName, { context, hashPrefix }) //  for example '[name]__[local]___[hash:base64:5]'
        : generateScopedName;
    } else {
      // small fallback
      scopedName = (local, filename) => Scope.generateScopedName(local, path.relative(context, filename));
    }

    const plugins = [
      Values,
      mode
        ? new LocalByDefault({ mode })
        : LocalByDefault,
      createImportedName
        ? new ExtractImports({ createImportedName })
        : ExtractImports,
      new Scope({ generateScopedName: scopedName }),
      new ResolveImports({ resolve: Object.assign({}, { extensions: [ext] }, resolveOpts) }),
    ];

    // https://github.com/postcss/postcss#options
    const runner = postcss(plugins);

    /**
     * @todo   think about replacing sequential fetch function calls with requires calls
     * @param  {string} _to
     * @param  {string} from
     * @return {object}
     */
    function fetch(_to, from) {
      // getting absolute path to the processing file
      const filename = /[^\\/?%*:|"<>.]/i.test(_to[0])
        ? require.resolve(_to)
        : path.resolve(path.dirname(from), _to);

      // checking cache
      let tokens = tokensByFile[filename];
      if (tokens) return tokens;

      const source = preprocessCss(readFileSync(filename, 'utf8'), filename);
      // https://github.com/postcss/postcss/blob/master/docs/api.md#processorprocesscss-opts
      const lazyResult = runner.process(source, assign({}, processorOpts, { from: filename }));

      // https://github.com/postcss/postcss/blob/master/docs/api.md#lazywarnings
      lazyResult.warnings().forEach(message => console.warn(message.text));

      tokens = lazyResult.root.exports || {};

      if (!debugMode) {
        // updating cache
        tokensByFile[filename] = tokens;
      } else {
        // clearing cache in development mode
        delete require.cache[filename];
      }

      if (processCss) processCss(lazyResult.css, filename);

      return tokens;
    }

    const hook = (filename) => {
      const tokens = fetch(filename, filename);
      return camelCase ? transformTokens(tokens, camelCase) : tokens;
    };

    const tokens = hook(filePath);
    return renderModule(tokens);
  },
};

# jest-css-modules-processor

You can use this module to realize `import` / `require` `.css` file when you run `jest`.
And this module also support `localIdentName`😎!

Inspired by [css-modules-require-hook](https://github.com/css-modules/css-modules-require-hook) and [jest-css-modules-transform](https://github.com/Connormiha/jest-css-modules-transform).

## Install

```sh
yarn add jest-css-modules-processor --dev
```

## Usage

Just add transform field for your jest config.

```json
// package.json
{
  "jest": {
    "moduleNameMapper": {
      ".+\\.(css)$": "<rootDir>/node_modules/jest-css-modules-processor/src/index.js"
    },
  }
}
```

## Config

You should add `jestCSSProcessor` field in your `package.json`.

```json
// package.json
{
  "jestCSSProcessor": {
    "generateScopedName": "[name]__[local]___[hash:base64:5]"
  }
}
```

|option|description|required|
|-|-|-|
|camelCase|same as css-loader?cameCase|no|
|devMode| NODE_ENV === 'development'|no|
|processCss| process(transformedCSS, filename)|no|
|processOptions|  http://api.postcss.org/global.html#processOptions|no|
|createImportedName| https://github.com/css-modules/postcss-modules-extract-imports/blob/master/src/index.js#L73|no|
|generateScopedName| for example `[name]__[local]___[hash:base64:5]`|no|
|mode| local or global|no|
|resolve| resolveOpts|no|
|rootDir| same as webpack context option|no|

Usually, you just need to set the `generateScopedName` option. And it should same as `localIndentName` value which you setted in the `webpack.config.js`

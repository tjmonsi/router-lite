const fs = require('fs');

let string = fs.readFileSync('./node_modules/path-to-regexp/index.js', 'utf8');
const strings = [
  'module.exports = pathToRegexp',
  'module.exports.parse = parse',
  'module.exports.compile = compile',
  'module.exports.tokensToFunction = tokensToFunction',
  'module.exports.tokensToRegExp = tokensToRegExp'
];

const additions = [
  '\nexport default pathToRegexp;',
  '\nexport { parse, compile, tokensToFunction, tokensToRegExp };'
];

for (let str of strings) {
  string = string.replace(str, '');
}

string += additions.join(' ');

fs.writeFileSync('./lib/path-to-regexp.js', string, 'utf8');

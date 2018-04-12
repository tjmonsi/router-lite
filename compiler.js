const fs = require('fs');
const file = './node_modules/path-to-regexp/index.js';

try {
  if (!fs.existsSync(file)) return console.log('Continuing installation...');
  
  let string = fs.readFileSync(file, 'utf8');
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
} catch (error) {
  console.log(error);
}



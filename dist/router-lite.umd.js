(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  /**
   * Expose `pathToRegexp`.
   */

  /**
   * Default configs.
   */
  var DEFAULT_DELIMITER = '/';
  var DEFAULT_DELIMITERS = './';

  /**
   * The main path matching regexp utility.
   *
   * @type {RegExp}
   */
  var PATH_REGEXP = new RegExp([
    // Match escaped characters that would otherwise appear in future matches.
    // This allows the user to escape special characters that won't transform.
    '(\\\\.)',
    // Match Express-style parameters and un-named parameters with a prefix
    // and optional suffixes. Matches appear as:
    //
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
    // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined]
    '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
  ].join('|'), 'g');

  /**
   * Parse a string for the raw tokens.
   *
   * @param  {string}  str
   * @param  {Object=} options
   * @return {!Array}
   */
  function parse (str, options) {
    var tokens = [];
    var key = 0;
    var index = 0;
    var path = '';
    var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
    var delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS;
    var pathEscaped = false;
    var res;

    while ((res = PATH_REGEXP.exec(str)) !== null) {
      var m = res[0];
      var escaped = res[1];
      var offset = res.index;
      path += str.slice(index, offset);
      index = offset + m.length;

      // Ignore already escaped sequences.
      if (escaped) {
        path += escaped[1];
        pathEscaped = true;
        continue;
      }

      var prev = '';
      var next = str[index];
      var name = res[2];
      var capture = res[3];
      var group = res[4];
      var modifier = res[5];

      if (!pathEscaped && path.length) {
        var k = path.length - 1;

        if (delimiters.indexOf(path[k]) > -1) {
          prev = path[k];
          path = path.slice(0, k);
        }
      }

      // Push the current path onto the tokens.
      if (path) {
        tokens.push(path);
        path = '';
        pathEscaped = false;
      }

      var partial = prev !== '' && next !== undefined && next !== prev;
      var repeat = modifier === '+' || modifier === '*';
      var optional = modifier === '?' || modifier === '*';
      var delimiter = prev || defaultDelimiter;
      var pattern = capture || group;

      tokens.push({
        name: name || key++,
        prefix: prev,
        delimiter: delimiter,
        optional: optional,
        repeat: repeat,
        partial: partial,
        pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
      });
    }

    // Push any remaining characters.
    if (path || index < str.length) {
      tokens.push(path + str.substr(index));
    }

    return tokens;
  }

  /**
   * Escape a regular expression string.
   *
   * @param  {string} str
   * @return {string}
   */
  function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
  }

  /**
   * Escape the capturing group by escaping special characters and meaning.
   *
   * @param  {string} group
   * @return {string}
   */
  function escapeGroup (group) {
    return group.replace(/([=!:$/()])/g, '\\$1');
  }

  /**
   * Get the flags for a regexp from the options.
   *
   * @param  {Object} options
   * @return {string}
   */
  function flags (options) {
    return options && options.sensitive ? '' : 'i';
  }

  /**
   * Pull out keys from a regexp.
   *
   * @param  {!RegExp} path
   * @param  {Array=}  keys
   * @return {!RegExp}
   */
  function regexpToRegexp (path, keys) {
    if (!keys) return path;

    // Use a negative lookahead to match only capturing groups.
    var groups = path.source.match(/\((?!\?)/g);

    if (groups) {
      for (var i = 0; i < groups.length; i++) {
        keys.push({
          name: i,
          prefix: null,
          delimiter: null,
          optional: false,
          repeat: false,
          partial: false,
          pattern: null
        });
      }
    }

    return path;
  }

  /**
   * Transform an array into a regexp.
   *
   * @param  {!Array}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function arrayToRegexp (path, keys, options) {
    var parts = [];

    for (var i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source);
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options));
  }

  /**
   * Create a path regexp from string input.
   *
   * @param  {string}  path
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function stringToRegexp (path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options);
  }

  /**
   * Expose a function for taking tokens and returning a RegExp.
   *
   * @param  {!Array}  tokens
   * @param  {Array=}  keys
   * @param  {Object=} options
   * @return {!RegExp}
   */
  function tokensToRegExp (tokens, keys, options) {
    options = options || {};

    var strict = options.strict;
    var end = options.end !== false;
    var delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
    var delimiters = options.delimiters || DEFAULT_DELIMITERS;
    var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
    var route = '';
    var isEndDelimited = false;

    // Iterate over the tokens and create our regexp string.
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        route += escapeString(token);
        isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1;
      } else {
        var prefix = escapeString(token.prefix);
        var capture = token.repeat
          ? '(?:' + token.pattern + ')(?:' + prefix + '(?:' + token.pattern + '))*'
          : token.pattern;

        if (keys) keys.push(token);

        if (token.optional) {
          if (token.partial) {
            route += prefix + '(' + capture + ')?';
          } else {
            route += '(?:' + prefix + '(' + capture + '))?';
          }
        } else {
          route += prefix + '(' + capture + ')';
        }
      }
    }

    if (end) {
      if (!strict) route += '(?:' + delimiter + ')?';

      route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
    } else {
      if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?';
      if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')';
    }

    return new RegExp('^' + route, flags(options));
  }

  /**
   * Normalize the given path string, returning a regular expression.
   *
   * An empty array can be passed in for the keys, which will hold the
   * placeholder key descriptions. For example, using `/user/:id`, `keys` will
   * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
   *
   * @param  {(string|RegExp|Array)} path
   * @param  {Array=}                keys
   * @param  {Object=}               options
   * @return {!RegExp}
   */
  function pathToRegexp (path, keys, options) {
    if (path instanceof RegExp) {
      return regexpToRegexp(path, keys);
    }

    if (Array.isArray(path)) {
      return arrayToRegexp(/** @type {!Array} */ (path), keys, options);
    }

    return stringToRegexp(/** @type {string} */ (path), keys, options);
  }

  /// <reference path="typings-project/global.d.ts"/>

  /**
   * # router-lite
   *
   * `<router-lite>`: A routing system that returns the route from a list of possible routes given a path
   * also returns route parameters given route
   *
   * @extends {HTMLElement}
   * @customElement
  */

  class RouterLite extends window.HTMLElement {
    static get is () {
      return 'router-lite';
    }

    static get observedAttributes () {
      return ['fallback-route'];
    }

    constructor () {
      super();
      this.__data = {};
      this.__routeInitialized = false;
      this._boundChildrenChanged = this._childrenChanged.bind(this);
      this.routes = [];
    }

    connectedCallback () {
      if (!this.fallbackRoute) this.fallbackRoute = 'no-page';

      // Handle any children that were already parsed before this
      // element upgraded
      if (this.children) {
        for (let child of Array.from(this.children)) {
          this._getRoute(child);
        }
      }

      // Handle any children that are added after this element is upgraded.
      // We do this because the MutationObserver will not fire if
      // the children were already parsed before the element was
      // upgraded.
      this._observer = new window.MutationObserver(this._boundChildrenChanged);
      this._observer.observe(this, { childList: true });

      if (this.hasAttribute('fallback-route')) {
        this.__data.fallbackRoute = this.getAttribute('fallback-route');
      }

      this.__routeInitialized = true;
      this._pathChanged(this.path);
    }

    disconnectedCallback () {
      if (this._observer) this._observer.disconnect();
    }

    set currentRoute (currentRoute) {
      this.__data.currentRoute = currentRoute;
      this.setAttribute('current-route', currentRoute);
    }

    get currentRoute () {
      return this.__data.currentRoute;
    }

    set fallbackRoute (fallbackRoute) {
      this.__data.fallbackRoute = fallbackRoute;
      this.setAttribute('fallback-route', fallbackRoute);
    }

    get fallbackRoute () {
      return this.__data.fallbackRoute;
    }

    set path (path) {
      this.__data.path = path;
      if (this.__routeInitialized) {
        this._pathChanged(path);
      }
    }

    get path () {
      return this.__data.path;
    }

    _childrenChanged (changes) {
      for (let change of changes) {
        if (change.type === 'childList' && change.addedNodes) {
          for (let child of Array.from(change.addedNodes)) {
            this._getRoute(child);
          }
        }
      }
    }

    _getRoute (child) {
      if (child.nodeName.toLowerCase() === 'route-data-lite') {
        if (child.route && typeof child.route === 'string' && child.route.trim()) {
          this.routes.push(child.route);
        } else if (child.hasAttribute('route') && typeof child.getAttribute('route') === 'string' && child.getAttribute('route').trim()) {
          this.routes.push(child.getAttribute('route'));
        } else {
          console.warn(`There's no route information found in route-data `, child);
        }
      } else {
        console.warn(`Only route-data-lite is allowed`, child);
      }
    }

    _pathChanged (path) {
      let exec = null;
      let re = null;
      let keys = [];
      for (let route of this.routes) {
        keys = [];
        re = pathToRegexp(route, keys);
        exec = re.exec(path);
        if (exec) return this._routeMatched(route, exec, keys);
      }
      return this._routeMatched(this.fallbackRoute, [], []);
    }

    _routeMatched (route, exec, keys) {
      const params = {};
      for (let i = 0, l = keys.length; i < l; i++) {
        let key = keys[i];
        let { name } = key;
        params[name] = exec[i + 1] || null;
      }

      this.routeParamObject = params;
      this.currentRoute = route;

      Promise.resolve().then(() => {
        this.dispatchEvent(new window.CustomEvent('route-param-object-change', { detail: this.routeParamObject }));
        this.dispatchEvent(new window.CustomEvent('current-route-change', { detail: this.currentRoute }));
      });
    }

    attributeChangedCallback (name, oldValue, newValue) {
      if (name === 'fallback-route' && this.__data.fallbackRoute !== newValue) {
        this.__data.fallbackRoute = newValue;
      }
    }
  }

  if (!window.customElements.get(RouterLite.is)) {
    window.customElements.define(RouterLite.is, RouterLite);
  } else {
    console.warn(`${RouterLite.is} is already defined somewhere. Please check your code.`);
  }

})));

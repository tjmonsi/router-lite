/// <reference path="typings-project/global.d.ts"/>

import pathToRegexp from './lib/path-to-regexp.js';

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

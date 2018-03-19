'use strict';

/// <reference path="typings-project/global.d.ts"/>

/**
 * # router-data-lite
 *
 * `<router-data-lite>`: It's a tag that you put inside router-lite to set the routes
 *
 * @extends {HTMLElement}
 * @customElement
*/

class RouteDataLite extends window.HTMLElement {
  static get is () {
    return 'route-data-lite';
  }

  set route (route) {
    this.setAttribute('route', route);
  }

  get route () {
    return this.getAttribute('route');
  }
}

if (!window.customElements.get(RouteDataLite.is)) {
  window.customElements.define(RouteDataLite.is, RouteDataLite);
} else {
  console.warn(`${RouteDataLite.is} is already defined somewhere. Please check your code.`);
}

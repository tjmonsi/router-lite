/// <reference path="typings-project/global.d.ts"/>

/**
 * # router-data-lite
 *
 * `<router-data-lite>`: It's a tag that you put inside router-lite to set the routes
 *
 * @extends {HTMLElement}
 * @customElement
*/

var RouteDataLite = (function (superclass) {
  function RouteDataLite () {
    superclass.apply(this, arguments);
  }

  if ( superclass ) RouteDataLite.__proto__ = superclass;
  RouteDataLite.prototype = Object.create( superclass && superclass.prototype );
  RouteDataLite.prototype.constructor = RouteDataLite;

  var prototypeAccessors = { route: { configurable: true } };
  var staticAccessors = { is: { configurable: true } };

  staticAccessors.is.get = function () {
    return 'route-data-lite';
  };

  prototypeAccessors.route.set = function (route) {
    this.setAttribute('route', route);
  };

  prototypeAccessors.route.get = function () {
    return this.getAttribute('route');
  };

  Object.defineProperties( RouteDataLite.prototype, prototypeAccessors );
  Object.defineProperties( RouteDataLite, staticAccessors );

  return RouteDataLite;
}(window.HTMLElement));

if (!window.customElements.get(RouteDataLite.is)) {
  window.customElements.define(RouteDataLite.is, RouteDataLite);
} else {
  console.warn(`${RouteDataLite.is} is already defined somewhere. Please check your code.`);
}

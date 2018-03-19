// @ts-nocheck
/* eslint-disable no-undef */

suite('RouterLite', () => {
  test('should have not be a HTMLUnknownElement constructor', () => {
    const el = document.querySelector('#test');
    expect(el.constructor.is).to.equal('router-lite');
  });

  test('should return the correct route', () => {
    const el = document.querySelector('#test');
    el.path = '/';
    expect(el.currentRoute).to.equal('/');

    el.path = '/path/yes';
    expect(el.currentRoute).to.equal('/path/:id');

    el.path = '/paththis/setter';
    expect(el.currentRoute).to.equal('/paththis/:id2');
  });

  test('should return fallbackRoute if no route is found', () => {
    const el = document.querySelector('#test');
    el.path = '/paththis/setter/hi';
    expect(el.currentRoute).to.equal(el.fallbackRoute);
  });

  test('should return the parameters', () => {
    const el = document.querySelector('#test');
    el.path = '/path/yes';
    expect(el.routeParamObject.id).to.equal('yes');

    el.path = '/paththis/setter';
    expect(el.routeParamObject.id2).to.equal('setter');
  });

  test('should fire current-route-change and return the correct route', done => {
    const el = document.querySelector('#test');
    const currentRouteChange = ({ detail }) => {
      el.removeEventListener('current-route-change', currentRouteChange);
      expect(detail).to.equal('/path/:id');
      done();
    };
    el.addEventListener('current-route-change', currentRouteChange);
    el.path = '/path/no';
  });

  test('should fire route-param-object-change and return the correct routeParamObject', done => {
    const el = document.querySelector('#test');
    const currentRouteChange = ({ detail }) => {
      el.removeEventListener('route-param-object-change', currentRouteChange);
      expect(detail.id2).to.equal('a');
      done();
    };
    el.addEventListener('route-param-object-change', currentRouteChange);
    el.path = '/paththis/a';
  });

});
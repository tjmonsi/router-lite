// @ts-nocheck
/* eslint-disable no-undef */

suite('RouteDataLite', () => {
  test('should have not be a HTMLUnknownElement constructor', () => {
    const el = document.querySelector('#test');
    expect(el.constructor.is).to.equal('route-data-lite');
  });

  test('should have the same property given attribute', () => {
    const el = document.querySelector('#test');
    expect(el.route).to.equal(el.getAttribute('route'));
  });
});
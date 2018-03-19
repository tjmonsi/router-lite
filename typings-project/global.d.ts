interface Window {
  HTMLElement: typeof HTMLElement,
  CustomEvent: typeof CustomEvent,
  MutationObserver: typeof MutationObserver
}

interface Function {
  createProperties (props)
  typeForProperty (property)
  is: String
  noShadow: Boolean
  observers: Array
}

interface ElementLiteBase extends HTMLElement {
  __ownProperties: Object
  properties: Object
}

interface HTMLElement {
  attachShadow(mode)
  connectedCallback ()
  disconnectedCallback ()
  attributeChangedCallback (name, old, value)
  shadowRoot: typeof Element | Element | DocumentFragment | document
}

interface shadowRoot {
  querySelector()
}

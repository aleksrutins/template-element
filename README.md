# template-element
## Usage
```js
import {TemplateElement} from 'https://cdn.jsdelivr.net/npm/template-element';

customElements.define('my-element', class extends TemplateElement {
	get template() {
		return `
<!-- HTML code goes here -->
Use angular-style bindings like {{count}} or {{hitheremyvar}} here - they resolve to the property on the class with that name. See below for more information.
`;
	}
	get styles() {
		return `
/* CSS code goes here */
You can also use angular-style bindings here
`;
	}
	get externalStyles() {
		// External stylesheet URLs
		// You can even use angular bindings in here!
		return ['https://path/to/bootstrap', 'https://any/other/style', ...];
	}
	beforeRenderCallback(isFirstRender) {
	  // called before the element is updated
	  // 'isFirstRender' is a boolean whether or not this is the forst time the element is rendered
	}
	afterRenderCallback() {
	  // called after element is updated
	}
// the 'rerender' function is used to rerender part or all of the page - see below
});

// Use it...
<my-element></my-element>
```

## More detail
### The `rerender` function
The `rerender` function has a syntax of:
```js
this.rerender(selector?)
```
`selector` denotes the selectors of the elements to be rerendered. It defaults to `*` if nothing is passed.<br/>
`rerender` rerenders the parts of the page that match `selector`. This is useful when you programatically change a property that is not bound to an attribute.<br/>
`rerender` is automatically called when one of the attributes denoted in [`static get observedAttributes`](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks).

### The `addObservable` fuction

The `addObservable` function has a syntax of:
```js
this.addObservable(propertyName, attributeName = propertyName)
```
It will add a getter/setter for `propertyName` that changes `attributeName`. This is useful for the angular-style bindings.

### The `addElementProperty` function
The `addElementProperty` function has a syntax of:
```js
this.addElementProperty(name, selector)
```
It adds a read-only property called `name` to the class, which will reference the element referred to by `selector`.

### Angular-style bindings
Angular-style bindings are denoted by the `{{`*`var`*`}}` syntax. This resolves to the `var` property on the element.<br/>
There are also two special bindings, `{{children}}` and `{{js[]}}`. `{{children}}` will insert a `<slot></slot>`. If you pass it a name, it will insert a slot with that name, like so: `{{children[slot: `*`slotName`*`}}`. `{{js[`*`code`*`]}}` will evaluate `code` and insert the result.
You can use them in the HTML, the CSS, or even the external stylesheet URLs.

### Event handlers
You can bind an event handler to an element with attributes of an @ sign followed by the name of the event. The value will be the name of the function on the element class that is to handle the event.<br/>
Example:
```html
<button @click="myButtonClicked">...</button>
```

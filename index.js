export class TemplateElement extends HTMLElement {
 	get template() {
        return ``;
    }
    get externalStyles() {
	return [];
	}
    get styles() {
        return ``;
    }
    constructor() {
        super();
        this.attachShadow({mode: "open"});
        this.__template__ = document.createElement('template');
        this.____event__handlers___ = {};
        this.____observers____ = new Map();
    }
    connectedCallback() {
      this.render(true);
    }
    render(firstTime = false) {
        if(firstTime) {
          this.__template__.innerHTML = `
${this.externalStyles.map(styleUrl => `<link rel="stylesheet" href=${styleUrl}>`).join('\n')}
<style>
	${this.styles}
</style>
${this.template}`;
        }
        this.beforeRenderCallback(firstTime);
        let bound = Object.assign(document.createElement('template'), {
          innerHTML: this.__template__.innerHTML.replace(/\{\{(.*?)\}\}/g, (all, prop) => {
                        return (binding.bind(this))(prop);
                      }) // Angular-style bindings
        });
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(document.importNode(bound.content, true));
        let elems = this.shadowRoot.querySelectorAll('*');
        let newElems = [].map.call(elems, elem => (checkElementAttributes.bind(this))(elem));
        [].map.call(newElems, ([elem, parent]) => {
          (parent || this.shadowRoot).appendChild(elem);
        });
        this.afterRenderCallback();
    }
    attributeChangedCallback() {
    	this.render();
    }
    rerender(selector = "*") {
      let rerenderedBound = document.createElement('template');
      this.__template__.content.querySelectorAll(selector).forEach(elem => {
        rerenderedBound.innerHTML += elem.outerHTML.replace(/\{\{(.*?)\}\}/g, (all, prop) => {
          return (binding.bind(this))(prop);
        });
      });
      let elems = Array.from(iterateTreeRecursive(rerenderedBound.content));
      let newElems = [].map.call(elems, elem => (checkElementAttributes.bind(this))(elem));
      for(let [i,elm] of enumerate(iterateTreeRecursive(this.shadowRoot.querySelectorAll(selector)))) {
        (newElems[i][1] || this.shadowRoot).insertBefore(newElems[i][0], elm);
        (elm.parentElement || this.shadowRoot).removeChild(elm);
      }
    }
    afterRenderCallback() {}
    beforeRenderCallback(isFirstRender) {}
    addObservable(prop, attribute = prop) {
      Object.defineProperty(this, prop, {
        get() {
          this.____observers____.get(prop).forEach(observer => observer("get", null));
          return this.getAttribute(attribute);
        },
        set(value) {
          this.____observers____.get(prop).forEach(observer => observer("set", value));
          this.setAttribute(attribute, value);
        }
      });
      this.____observers____.set(prop, []);
    }
    addElementProperty(name, selector) {
      Object.defineProperty(this, name, {
        get() {
          return this.shadowRoot.querySelector(selector);
        }
      });
    }
}
export function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}
export function htmlToElements(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
}

export function htmlEntitiesDecode(str) {
    return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function binding(prop, explicitlyReturnPropertyBinding = true) {
  if(prop === "children") {
    return '<slot></slot>'
  } else if (prop.match(/children\[slot\s?\:\s?(.*?)\]/)) {
    let name = prop.match(/children\[slot\s?\:\s?(?<slotName>.*?)\]/).groups.slotName;
    return `<slot name="${name}"></slot>`;
  } else if (prop.match(/js\[([\s\S]*)\]/)) {
    let code = prop.match(/js\[(?<code>[\s\S]*)\]/).groups.code;
    return (() => {
      let window = null;
      let document = null;
      let navigator = null;
      return eval(htmlEntitiesDecode(code))
    }).bind(this)();
  } else {
    if(explicitlyReturnPropertyBinding) return (prop in this? this[prop] : `{{${prop}}}`);
    else return true;
  }
  return false;
}
function checkElementAttributes(elem) {
  [].forEach.call(elem.attributes || [], (attr) => {
    if(attr.name.startsWith('@') && !(`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___` in this.____event__handlers___ && this.____event__handlers___[`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___`].__elemRefs.includes(elem))) {
      // Event handler
      let __evt_elem_refs;
      try {
        __evt_elem_refs = this.____event__handlers___[`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___`].__elemRefs;
      } catch(e) {
        __evt_elem_refs = [];
      }
      this.____event__handlers___[`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___`] = this.____event__handlers___[`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___`]? this.____event__handlers___[`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___`] : this[attr.value].bind(this);
      __evt_elem_refs.push(elem);
      this.____event__handlers___[`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___`].__elemRefs = __evt_elem_refs;
      elem.addEventListener(attr.name.slice(1), this.____event__handlers___[`___evt__listener____${elem.tagName}__${attr.name.slice(1)}__${attr.value}___`]);
      elem.removeAttributeNode(attr);
    } else if(attr.name.startsWith('[') && attr.name.endsWith(']')) {
      // Attribute binding
      let binder = attr.name.slice(1,-1);
      let value = (binding.bind(this))(attr.value, false);
      if(value === true) {
        // Property binding
        this.____observers____.get(attr.value).push((type, val) => {
          if(type == "set") {
            elem.setAttribute(binder, val);
          }
        })
        elem.setAttribute(binder, this[attr.value]);
      } else {
        elem.setAttribute(binder, value);
      }
    }
  });
  if(elem.hasAttribute('repeat')) {
    let rept = document.createDocumentFragment();
    let {list, itvar} = elem.getAttribute('repeat').match(/^(?<itvar>.*?)\sin\s(?<list>.*?)$/).groups;
    this[list].forEach(item => {
      let curMaleable = document.importNode(elem, true);
      curMaleable.innerHTML = curMaleable.innerHTML.replace(/\{\{(.*?)\}\}/g, (all, binding) => {
        if(binding == itvar) return item;
        else return all;
      });
      curMaleable.removeAttribute('repeat');
      rept.appendChild(curMaleable);
    });
    if(elem.parentElement) elem.parentElement.removeChild(elem);
    return [rept, elem.parentElement || null];
  } else {
    return [elem, elem.parentElement || null];
  }
}
function *iterateTreeRecursive(elem) {
  if(elem instanceof Node) {
    for(let ch of elem.children) {
      yield ch;
      yield* iterateTreeRecursive(ch);
    }
  } else if (elem instanceof Array || elem instanceof NamedNodeMap || elem instanceof NodeList) {
    for(let elm of elem) {
      yield elm;
      yield* iterateTreeRecursive(elm);
    }
  }
}
function* enumerate(iterable) {
    let i = 0;

    for (const x of iterable) {
        yield [i, x];
        i++;
    }
}

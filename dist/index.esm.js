var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var nanoDom = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

var selfClosing = ['input', 'link', 'meta', 'hr', 'br', 'source', 'img'];

function parseAttributes(node, attributes) {
	attributes = (attributes || '').trim();
	if (attributes.length <= 0) {
		return;
	}
	var match = [];
	var position = 0;
	var charCode = attributes.charCodeAt(position);
	while (charCode >= 65 && charCode <= 90 || // upper-cased characters
	charCode >= 97 && charCode <= 122 || // lower-cased characters
	charCode >= 48 && charCode <= 57 || // numbers
	charCode === 58 || charCode === 45 || // colons and dashes
	charCode === 95) {
		// underscores
		match[1] = (match[1] || '') + attributes.charAt(position);
		charCode = attributes.charCodeAt(++position);
	}
	attributes = attributes.substr(position).trim();
	if (attributes[0] !== '=') {
		node.setAttribute(match[1], match[1]);
		parseAttributes(node, attributes);
	} else {
		attributes = attributes.substr(1).trim();
		if (attributes[0] === '"' || attributes[0] === "'") {
			// search for another "
			position = 1;
			while (attributes[position] !== attributes[0]) {
				match[2] = (match[2] || '') + attributes[position];
				position += 1;
			}
			attributes = attributes.substr(position + 1);
		} else {
			match[2] = attributes.split(' ')[0];
			attributes = attributes.split(' ').slice(1).join(' ');
		}
		node.setAttribute(match[1], match[2]);
		if (match[1] === 'class') {
			node.classList.add(match[2]);
		} else if (match[1] === 'title' || match[1] === 'id' || match[1] === 'name') {
			node[match[1]] = match[2];
		}
		return parseAttributes(node, attributes);
	}
}

function getNextTag(html) {
	var position = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : -1;

	var match = null;
	if (position < 0) {
		position = html.indexOf('<');
	}
	// we are at a < now or at the end of the string
	if (position >= 0 && position < html.length) {
		match = [];
		match.index = position;
		position += 1;
		if (html[position] === '/') {
			match[1] = '/';
			position += 1;
		}
		var charCode = html.charCodeAt(position);
		// read all tag name characters
		while (charCode >= 65 && charCode <= 90 || // upper-cased characters
		charCode >= 97 && charCode <= 122 || // lower-cased characters
		charCode >= 48 && charCode <= 57 || // numbers
		charCode === 58 || charCode === 45 || // colons and dashes
		charCode === 95) {
			// underscores
			match[2] = (match[2] || '') + html.charAt(position);
			charCode = html.charCodeAt(++position);
		}
		if (!match[2]) {
			return getNextTag(html, html.indexOf('<', position));
		}
		var startAttrs = position;
		while (position < html.length && html[position] !== '>') {
			position++;
		}
		if (position < html.length) {
			var endAttrs = position;
			if (html[position - 1] === '/') {
				match[4] = '/';
				endAttrs = position - 1;
			}
			if (endAttrs - startAttrs > 1) {
				// we have something
				match[3] = html.substring(startAttrs, endAttrs);
			}
		}
		match[0] = html.substring(match.index, position + 1);
	}
	return match;
}

var level = [];
function parse(document, html, parentNode) {
	var match = void 0;

	while (match = getNextTag(html)) {
		if (match[1]) {
			// closing tag
			if (level.length === 0) throw new Error('Unexpected closing tag ' + match[2]);
			var closed = level.pop();
			if (closed !== match[2]) throw new Error('Unexpected closing tag ' + match[2] + '; expected ' + closed);
			var content = html.substring(0, match.index);
			if (content) {
				parentNode.appendChild(document.createTextNode(content));
			}
			return html.substr(match.index + match[0].length);
		} else {
			// opening tag
			var _content = html.substring(0, match.index);
			if (_content) {
				parentNode.appendChild(document.createTextNode(_content));
			}
			var node = document.createElement(match[2]);
			parseAttributes(node, match[3]);
			if (!match[4] && selfClosing.indexOf(match[2]) < 0) {
				level.push(match[2]);
				html = parse(document, html.substr(match.index + match[0].length), node);
			} else {
				html = html.substr(match.index + match[0].length);
			}
			parentNode.appendChild(node);
		}
	}
	if (level.length > 0) {
		throw new Error('Unclosed tag' + (level.length > 1 ? 's ' : ' ') + level.join(', '));
	}
	if (html.length > 0) {
		parentNode.appendChild(document.createTextNode(html));
	}
	return html;
}

// helpers
var regExp = function regExp(name) {
	return new RegExp('(^| )' + name + '( |$)');
};
var forEach = function forEach(list, fn, scope) {
	for (var i = 0; i < list.length; i++) {
		fn.call(scope, list[i]);
	}
};

// class list object with basic methods
function ClassList(element) {
	this.element = element;
}

ClassList.prototype = {
	add: function add() {
		forEach(arguments, function (name) {
			if (!this.contains(name)) {
				this.element.className += this.element.className.length > 0 ? ' ' + name : name;
			}
		}, this);
	},
	remove: function remove() {
		forEach(arguments, function (name) {
			this.element.className = this.element.className.replace(regExp(name), '');
		}, this);
	},
	toggle: function toggle(name) {
		return this.contains(name) ? (this.remove(name), false) : (this.add(name), true);
	},
	contains: function contains(name) {
		return regExp(name).test(this.element.className);
	},
	// bonus..
	replace: function replace(oldName, newName) {
		this.remove(oldName), this.add(newName);
	}
};

function matchesSelector(tag, selector) {
	var selectors = selector.split(/\s*,\s*/),
	    match = void 0;
	for (var all in selectors) {
		if (match = selectors[all].match(/(?:([\w*:_-]+)?\[([\w:_-]+)(?:(\$|\^|\*)?=(?:(?:'([^']*)')|(?:"([^"]*)")))?\])|(?:\.([\w_-]+))|([\w*:_-]+)/g)) {
			var value = RegExp.$4 || RegExp.$5;
			if (RegExp.$7 === tag.tagName || RegExp.$7 === '*') return true;
			if (RegExp.$6 && tag.classList.contains(RegExp.$6)) return true;
			if (RegExp.$1 && tag.tagName !== RegExp.$1) continue;
			var attribute = tag.getAttribute(RegExp.$2);
			if (!RegExp.$3 && !value && typeof tag.attributes[RegExp.$2] !== 'undefined') return true;
			if (!RegExp.$3 && value && attribute === value) return true;
			if (RegExp.$3 && RegExp.$3 === '^' && attribute.indexOf(value) === 0) return true;
			if (RegExp.$3 && RegExp.$3 === '$' && attribute.match(new RegExp(value + '$'))) return true;
			if (RegExp.$3 && RegExp.$3 === '*' && attribute.indexOf(value) >= 0) return true;
		}
	}
	return false;
}

function findElements(start, filterFn) {
	var result = [];
	start.children.forEach(function (child) {
		result = result.concat(filterFn(child) ? child : [], findElements(child, filterFn));
	});
	return result;
}

function HTMLElement(name, owner) {
	this.nodeType = 1;
	this.nodeName = name;
	this.tagName = name;
	this.className = '';
	this.childNodes = [];
	this.style = {};
	this.ownerDocument = owner;
	this.parentNode = null;
	this.attributes = [];
}

Object.defineProperty(HTMLElement.prototype, 'children', {
	get: function get() {
		return this.childNodes.filter(function (node) {
			return node.nodeType === 1;
		});
	}
});
Object.defineProperty(HTMLElement.prototype, 'classList', {
	get: function get() {
		return new ClassList(this);
	}
});
Object.defineProperty(HTMLElement.prototype, 'innerHTML', {
	get: function get() {
		return this.childNodes.map(function (tag) {
			return tag.nodeType === 1 ? tag.outerHTML : tag.nodeValue;
		}).join('');
	},
	set: function set(value) {
		this.childNodes = [];
		level = [];
		parse(this.ownerDocument, value, this);
	}
});
Object.defineProperty(HTMLElement.prototype, 'outerHTML', {
	get: function get() {
		var _this = this;

		if (Object.prototype.toString.call(this.attributes) !== '[object Array]') {
			this.attributes = Object.keys(this.attributes).map(function (entry) {
				return { name: entry, value: _this.attributes[entry] };
			});
			this.attributes.forEach(function (attr, idx, arr) {
				_this.attributes[attr.name] = attr.value;
			});
		}
		var attributes = this.attributes.map(function (attr) {
			return attr.name + '="' + (typeof attr.value === 'undefined' ? '' : attr.value) + '"';
		}).join(' ');
		if (selfClosing.indexOf(this.tagName) >= 0) {
			return '<' + this.tagName + (attributes ? ' ' + attributes : '') + '/>';
		} else {
			return '<' + this.tagName + (attributes ? ' ' + attributes : '') + '>' + this.innerHTML + '</' + this.tagName + '>';
		}
	}
});
HTMLElement.prototype.appendChild = function (child) {
	this.childNodes.push(child);
	child.parentNode = this;
};
HTMLElement.prototype.removeChild = function (child) {
	var idx = this.childNodes.indexOf(child);
	if (idx >= 0) this.childNodes.splice(idx, 1);
};
HTMLElement.prototype.setAttribute = function (name, value) {
	var obj = { name: name, value: value };
	if (this.attributes[name]) {
		this.attributes[this.attributes.indexOf(this.attributes[name])] = obj;
	} else {
		this.attributes.push(obj);
	}
	this.attributes[name] = obj;
	if (name === 'class') this.className = value;
};
HTMLElement.prototype.removeAttribute = function (name) {
	var idx = this.attributes.indexOf(this.attributes[name]);
	if (idx >= 0) {
		this.attributes.splice(idx, 1);
	}
	delete this.attributes[name];
};
HTMLElement.prototype.getAttribute = function (name) {
	return this.attributes[name] && this.attributes[name].value || '';
};
HTMLElement.prototype.replaceChild = function (newChild, toReplace) {
	var idx = this.childNodes.indexOf(toReplace);
	this.childNodes.splice(idx, 1, newChild);
	newChild.parentNode = this;
};
HTMLElement.prototype.addEventListener = function () {};
HTMLElement.prototype.removeEventListener = function () {};
HTMLElement.prototype.getElementsByTagName = function (tagName) {
	return findElements(this, function (el) {
		return el.tagName === tagName;
	});
};
HTMLElement.prototype.getElementsByClassName = function (className) {
	return findElements(this, function (el) {
		return el.classList.contains(className);
	});
};
HTMLElement.prototype.querySelectorAll = function (selector) {
	return findElements(this, function (el) {
		return matchesSelector(el, selector);
	});
};
HTMLElement.prototype.getElementById = function (id) {
	return findElements(this, function (el) {
		return el.getAttribute('id') === id;
	})[0];
};

function DOMText(content, owner) {
	this.nodeValue = content;
	this.nodeType = 3;
	this.parentNode = null;
	this.ownerDocument = owner;
}

function Document(html) {
	var _this2 = this;

	if (!this instanceof Document) {
		return new Document(html);
	}

	this.createElement = function (name) {
		return new HTMLElement(name, _this2);
	};
	this.createTextNode = function (content) {
		return new DOMText(content, _this2);
	};
	this.getElementById = HTMLElement.prototype.getElementById.bind(this);
	this.getElementsByTagName = HTMLElement.prototype.getElementsByTagName.bind(this);
	this.getElementsByClassName = HTMLElement.prototype.getElementsByClassName.bind(this);
	this.querySelectorAll = HTMLElement.prototype.querySelectorAll.bind(this);
	this.addEventListener = function () {};
	this.removeEventListener = function () {};

	this.documentElement = this.createElement('html');
	this.childNodes = [this.documentElement];
	this.children = [this.documentElement];
	this.nodeType = 9;

	if (typeof html !== 'string' || html.trim().indexOf('<!DOCTYPE') < 0) {
		this.head = this.createElement('head');
		this.body = this.createElement('body');
		this.documentElement.appendChild(this.head);
		this.documentElement.appendChild(this.body);
		if (typeof html === 'string') {
			level = [];
			parse(this, html, this.body);
		}
	} else {
		html.match(/<html([^>]*)>/);
		if (RegExp.$1) {
			parseAttributes(this.documentElement, RegExp.$1);
		}
		html = html.replace(/<!DOCTYPE[^>]+>[\n\s]*<html([^>]*)>/g, '').replace(/<\/html>/g, '');
		level = [];
		parse(this, html, this.documentElement);
		this.head = this.getElementsByTagName('head')[0];
		this.body = this.getElementsByTagName('body')[0];
	}
}

module.exports = Document;
module.exports.DOMElement = HTMLElement;
module.exports.DOMText = DOMText;
typeof commonjsGlobal !== 'undefined' && (commonjsGlobal.HTMLElement = HTMLElement);
});

unwrapExports(nanoDom);
var nanoDom_1 = nanoDom.DOMElement;
var nanoDom_2 = nanoDom.DOMText;

let tagKey = 0;
const NODE_TYPE_TAG = 1;
const NODE_TYPE_TEXT = 3;

/**
 * Render for the client (build a virtual DOM)
 *
 * @param {React|Preact|Inferno|vdom} h - Any React-compatible API or virtual dom
 * @param {string} html - HTML string to parse
 * @param {string} propsMap - Hash of prop { name: value } to replace on parse
 * @param {string} componentMap - Hash of components { name: Component } to replace  matching tagName with on parse
 * @return {Object} Virtual DOM
 */
function render(h, html, propsMap = {}, componentMap = {}) {
  return traverseToVdom(h, parseHTMLToDOM(html), propsMap, componentMap);
}

/**
 * Parse HTML to DOM tree (via nano-dom)
 *
 * @param {string} html - HTML string to parse
 * @return {Object} HTML node hierarchy tree
 */
function parseHTMLToDOM(html) {
  let dom = new nanoDom(html);
  return dom.body.children;
}

/**
 * Render for the client (build a virtual DOM)
 *
 * @param {React|Preact|Inferno|vdom} h - Any React-compatable API or virtual dom
 * @param {string} obj - DOM hierarchy tree
 * @param {string} propsMap - Hash of prop { name: value } to replace on parse
 * @param {string} componentMap - Hash of components { name: Component } to replace  matching tagName with on parse
 * @return {Object} Virtual DOM Node
 */
function traverseToVdom(h, obj, propsMap = {}, componentMap = {}) {
	if (Array.isArray(obj)) {
    return obj
      .filter(t => t)
      .map(tag => traverseToVdom(h, tag, propsMap, componentMap));
	}

  if (!obj) {
    return;
  }

	var type = obj.nodeType,
		tagName = obj.tagName,
		children = obj.childNodes,
		comp;

  delete obj.parentNode;

	if (type == NODE_TYPE_TAG) {
    let attributes = attrs(obj.attributes);

    // Map specified components to their respective passed-in React components by name
    let tagComponentKey = Object.keys(componentMap).find(key => tagName.toLowerCase() === key.toLowerCase());

    if (tagComponentKey) {
      tagName = componentMap[tagComponentKey];
    }

    // Check props for things in propsMap
    Object.keys(attributes).forEach(function(key) {
      let value = attributes[key];
      let propKey = Object.keys(propsMap).find(key => key === value);

      // Replace attribute value with passed in value
      // NOTE: this is typically for function references
      if (propKey) {
        attributes[key] = propsMap[propKey];
        delete propsMap[propKey];
      }
    });

    // Check for placeholders in string children
    children = children.map(child => {
      let data = child.nodeValue;

      if (typeof data !== 'string') {
        return child;
      }

      if (propsMap[data]) {
        child.nodeValue = propsMap[data];
        delete propsMap[data];
      }

      return child;
    });

    // Always use a key if not present
    if (attributes.key === undefined) {
      attributes.key = '__jsx-tmpl-key-' + (++tagKey);
    }

    let nodeChildren = children.map(c => traverseToVdom(h, c, propsMap, componentMap));

    comp = h(tagName, attributes, nodeChildren.length > 0 ? nodeChildren : null);
	} else if (type == NODE_TYPE_TEXT) {
		comp = replacePropsInTextNode(obj.nodeValue, propsMap);
	}

	return comp;
}

const REGEX_ONLY_EMPTY_SPACES = /^\s+$/;
function replacePropsInTextNode(text, props) {
  let propKeys = Object.keys(props);
  let textParts = [];

  propKeys.forEach(key => {
    if (text.includes(key)) {
      let keyParts = text.split(key);
      keyParts.splice(1, 0, props[key]);

      textParts = textParts.concat(keyParts);
      delete props[key];
    }
  });

  // No placeholders found in text
  if (textParts.length === 0) {
    textParts = [text];
  }

  // Return text parts trimmed and cleaned up
  return textParts
    .map(text => {
      if (typeof text !== 'string') {
        return text;
      }

      text = text
        .replace('\n', '')
        .replace(/\s+/g, ' ');

      // If string is entirely empty spaces, return null (will be filtered out)
      if (REGEX_ONLY_EMPTY_SPACES.test(text)) {
        return null;
      }

      return text;
    })
    .filter(t => t);
}

/**
 * Build attribtues object
 *
 * @param {Object} obj
 * @return {Object}
 */
function attrs(attributes) {
	if (isEmptyObject(attributes)) {
		return {};
	}

	var attribObj = {};

  for (let index = 0, length = attributes.length, attribute; attribute = attributes[index], index < length; index += 1) {
		if (attribute.name == 'class') {
			attribObj.className = attribute.value;
		} else if (attribute.name == 'for') {
			attribObj.htmlFor = attribute.value;
		} else {
			attribObj[attribute.name] = attribute.value;
		}
  }

	return attribObj;
}

/**
 * Is empty object?
 *
 * @param {Object} obj
 * @return {Object}
 */
function isEmptyObject(obj) {
	return Object.getOwnPropertyNames(obj).length === 0;
}

var client = {
  render,
};
var client_1 = client.render;

function hash(str) {
  var hash = 5381,
      i    = str.length;

  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return hash >>> 0;
}

var stringHash = hash;

/**
 * Parsed, compiled template functions are kept here and re-used for
 * consecutive re-renders instead of compiling the whole template every render
 */
const tmplCache = {};

/**
 * Render template value as string
 *
 * @param {String} value
 * @return {string}
 */
function templateValueToJSX(value) {
  if (value === undefined || value === null) {
    return '';
  }

  // Handle arrays of sub-data
  if (value instanceof Array) {
    let values = value.map(val => templateValueToJSX(val));

    return values.join('');
  }

  return value.toString();
}

/**
 * ES6 tagged template literal function
 *
 * @param {Function|Object} vdom the VDOM generating function or the Preact/React object
 * @param {Object} componentMap the list of components used by the template literal
 * @return {Function} the tagged template literal function
 */
function getJSXTag(vdom, componentMap) {
  const h = vdom.h || vdom.createElement || vdom;

  return function (strings, ...values) {
    let output = '';
    let index = 0;
    let propsMap = {};

    for (index = 0; index < values.length; index++) {
      let value = values[index];
      let valueString;

      if (typeof value !== 'string') {
        let propPlaceholder = getPropPlaceholder(value);

        propsMap[propPlaceholder] = value;

        valueString = propPlaceholder;
      }

      if (valueString === undefined) {
        valueString = templateValueToJSX(value);
      }

      output += strings[index] + valueString;
    }

    output += strings[index];

    output = output.trimRight();
  
    return jsxTmplResult(output, propsMap, h, componentMap);
  };
}

/**
 * Return render function for components
 */
function jsxTmplResult(output, propsMap, h, componentMap) {
  let tmplHash = stringHash(output);
  if (tmplCache[tmplHash] !== undefined) {
    tmplCache[tmplHash].fromCache = true;
    return tmplCache[tmplHash];
  }

  let result = client_1(h, output, propsMap, componentMap).shift();

  // Add to cache
  tmplCache[tmplHash] = result;

  return result;
}

/**
 * Get name from given React component or function
 *
 * @param {function} value
 * @return {string}
 */
let propIncrement = 0;
function getPropPlaceholder(value) {
  let propName = (value && (value.name || value.constructor.name) || typeof value) + '_' + ++propIncrement;

  return '[[' + propName + ']]';
}

export { getJSXTag };

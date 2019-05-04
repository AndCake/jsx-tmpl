const Document = require('nano-dom');
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
  let dom = new Document(html);
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
    if (text.toString().includes(key)) {
      let keyParts = text.toString().split(key);
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
        .replace(/\s+/g, ' ')

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

	var key,
		attribObj = {},
		regularKeys = /(data-||aria-)?/;

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

module.exports = {
  render,
};

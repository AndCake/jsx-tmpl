import * as client from './client';
import hash from 'string-hash';

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
  let tmplHash = hash(output);
  if (tmplCache[tmplHash] !== undefined) {
    tmplCache[tmplHash].fromCache = true;
    return tmplCache[tmplHash];
  }

  let result = client.render(h, output, propsMap, componentMap).shift();

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

export {getJSXTag};

# Template to JSX
Build a VDOM using native ES6 templates. No transpiling required for Node.js or modern browsers.

This library is based on Vance Luca's [jsx-tmpl](http://github.com/vlucas/jsx-tmpl). All credit for creating this library goes to him.

## Features

* *Valid ES6 syntax* (no transpiling required for Node and modern browsers)
* Caches JSX compilation for consecutive render() calls (so the HTML string is not converted to JSX on each render)
* Converts HTML properties like "class" and "for" to required "className" and "htmlFor" for React
* Use with *any React-compatible framework* (React, Preact, Inferno, etc.) or virtual DOM library

## Installation

```
npm i template2jsx --save
```

## Usage

Just use the `getJSXTag` function to generate a tagged template literal and write normal HTML markup inside native ES6 templates.

```javascript
const { getJSXTag } = require('template2jsx');
const Greeting = require('./Greeting');
const React = require('react');

// Pass in React, and a hash of components used
const html = getJSXTag(React, {Greeting});

class App extends React.PureComponent {
  render() {
    return html`
      <div class="App">
        <Greeting name="John Doe" />
      </div>
    `; 
  }
}
```

### Passing Variables / Props

For dynamic props or rendering variables, use standard ES6 template interpolation:

```javascript
const { getJSXTag } = require('template2jsx');
const Greeting = require('./Greeting');
const React = require('react');

const html = getJSXTag(React, {Greeting});

class App extends React.PureComponent {
  render() {
    let name = "John Doe";

    return html`
      <div class="App">
        <Greeting name=${name} />
      </div>
    `; // Pass in React, and a hash of components used
  }
}
```

### Usage with Preact

Since React is passed in as a parameter to the resulting render function, you
can substitute it for [Preact](https://preactjs.com/), or any other virtual DOM
library or React-compatible framework.

```javascript
const { getJSXTag } = require('template2jsx');
const Preact = require('preact');

// Pass in Preact instead of React!
const html = getJSXTag(Preact);

class App extends Preact.Component {
  render() {
    let name = "John Doe";

    return html`
      <div class="App">
        Hell World!
      </div>
    `;
  }
}
```
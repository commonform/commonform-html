```javascript
var html = require('commonform-html')
```

Call the exported function with a Common Form, receive a string of HTML:

```javascript
var assert = require('assert')

assert.equal(
  html({ content: [ 'Just a test' ] }),
  '<div class="article"><p><span>Just a test</span></p></div>')

assert.equal(
  html({
    content: [
      { heading: 'A',
        form: { content: [ 'This is A' ] } },
      { heading: 'B',
        form: { content: [ 'This is B' ] } } ] }),
  [ '<div class="article">',
      '<div class="section">',
        '<h1>A</h1>',
        '<p><span>This is A</span></p>',
      '</div>',
      '<div class="section">',
        '<h1>B</h1>',
        '<p><span>This is B</span></p>',
      '</div>',
    '</div>' ]
    .join(''))

```

You can also pass an `Object` map of fill-in-the-blank values:

```javascript
assert.equal(
  html(
    { content: [ { blank: 'name' } ] },
    { name: 'Joe' }),
  '<div class="article"><p><span class="blank">Joe</span></p></div>')
```

A final argument of `{ html5: true }` specifies HTML5 output:

```javascript
assert.equal(
  html({ content: [ 'Just a test' ] }, { }, { html5: true }),
  '<article><p><span>Just a test</span></p></article>')

assert.equal(
  html({
    content: [
      'First text defines a ',
      { definition: 'Term' },
      { heading: 'A',
        form: { content: [ 'This is A' ] } },
      'Middle text uses a ',
      { use: 'Term' },
      { heading: 'B',
        form: { content: [ 'This is B' ] } },
      'Last text references ',
      { reference: 'Elsewhere' }] },
    { },
    { html5: true }),
  [ '<article>', // not <div class="article">
      '<p>',
        '<span>First text defines a </span>',
        '<dfn>Term</dfn>', // not <span class="definition">
      '</p>',
      '<section>', // not <div class="section">
        '<h1>A</h1>',
        '<p><span>This is A</span></p>',
      '</section>',
      '<p>',
        '<span>Middle text uses a </span>',
        '<span class="term">Term</span>',
      '</p>',
      '<section>',
        '<h1>B</h1>',
        '<p><span>This is B</span></p>',
      '</section>',
      '<p>',
        '<span>Last text references </span>',
        '<span class="reference">Elsewhere</span>',
      '</p>',
    '</article>' ]
    .join(''))
```

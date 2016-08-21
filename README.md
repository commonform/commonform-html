```javascript
var html = require('commonform-html')
```

Call the exported function with a Common Form, receive a string of HTML:

```javascript
var assert = require('assert')

assert.equal(
  html({ content: [ 'Just a test' ] }),
  '<div class="article"><p>Just a test</p></div>')

assert.equal(
  html({
    content: [
      {
        heading: 'A',
        form: {content: ['This is A']}
      },
      {
        heading: 'B',
        form: {content: ['This is B']}
      }
    ]
  }),
  [
    '<div class="article">',
      '<div class="section">',
        '<h1>A</h1>',
        '<p>This is A</p>',
      '</div>',
      '<div class="section">',
        '<h1>B</h1>',
        '<p>This is B</p>',
      '</div>',
    '</div>'
  ]
  .join('')
)
```

You can also pass an `Array` of fill-in-the-blank values:

```javascript
assert.equal(
  html(
    {
      content: [
        {blank: ''},
        {form: {content: ['Another ', {blank: ''}]}}
      ]
    },
    [
      {blank: ['content', 0], value: 'Joe'},
      {blank: ['content', 1, 'form', 'content', 1], value: 'Bob'}
    ]
  ),
  (
    '<div class="article">' +
      '<p><span class="blank">Joe</span></p>' +
      '<div class="section">' +
        '<p>Another <span class="blank">Bob</span></p>' +
      '</div>' +
    '</div>'
  )
)
```

A final argument of `{ html5: true }` specifies HTML5 output:

```javascript
assert.equal(
  html({content: ['Just a test']}, [], {html5: true}),
  '<article><p>Just a test</p></article>'
)

assert.equal(
  html(
    {
      content: [
        'First text defines a ',
        {definition: 'Term'},
        {
          heading: 'A',
          form: {content: ['This is A']}
        },
        'Middle text uses a ',
        {use: 'Term'},
        {
          heading: 'B',
          form: {content: ['This is B']}
        },
        'Last text references ',
        {reference: 'Elsewhere'}
      ]
    },
    [],
    {html5: true}
  ),
  [
    '<article>', // not <div class="article">
      '<p>',
        'First text defines a ',
        '<dfn>Term</dfn>', // not <span class="definition">
      '</p>',
      '<section>', // not <div class="section">
        '<h1>A</h1>',
        '<p>This is A</p>',
      '</section>',
      '<p>',
        'Middle text uses a ',
        '<span class="term">Term</span>',
      '</p>',
      '<section>',
        '<h1>B</h1>',
        '<p>This is B</p>',
      '</section>',
      '<p>',
        'Last text references ',
        '<span class="reference">Elsewhere</span>',
      '</p>',
    '</article>'
  ]
  .join('')
)
```

You can also set a title:

```javascript
assert.equal(
  html(
    {content: ['Hello, ', {blank: ''}]},
    [{blank: ['content', 1], value: 'Joe'}],
    {title: 'Welcome'}
  ),
  [
    '<div class="article">',
      '<h1>Welcome</h1>',
      '<p>',
        'Hello, <span class="blank">Joe</span>',
      '</p>',
    '</div>'
  ]
  .join('')
)
```

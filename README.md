# commonform-html

render [Common Forms](https://www.npmjs.com/package/commonform-validate) in HTML

```javascript
var html = require('commonform-html')
```

Call the exported function with a Common Form, receive a string of HTML:

```javascript
var assert = require('assert')

assert.deepStrictEqual(
  html({ content: ['Just a test'] }),
  '<div class="article"><p>Just a test</p></div>'
)

assert.deepStrictEqual(
  html({
    content: [
      {
        heading: 'A',
        form: { content: ['This is A'] }
      },
      {
        heading: 'B',
        form: { content: ['This is B'] }
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
assert.deepStrictEqual(
  html(
    {
      content: [
        { blank: '' },
        { form: { content: ['Another ', { blank: '' }] } }
      ]
    },
    [
      { blank: ['content', 0], value: 'Joe' },
      { blank: ['content', 1, 'form', 'content', 1], value: 'Bob' }
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
assert.deepStrictEqual(
  html({ content: ['Just a test'] }, [], { html5: true }),
  '<article><p>Just a test</p></article>'
)

assert.deepStrictEqual(
  html(
    {
      content: [
        'First text defines a ',
        { definition: 'Term' },
        {
          heading: 'A',
          form: { content: ['This is A'] }
        },
        'Middle text uses a ',
        { use: 'Term' },
        {
          heading: 'B',
          form: { content: ['This is B'] }
        },
        'Last text references ',
        { reference: 'Elsewhere' }
      ]
    },
    [],
    { html5: true }
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

The option `{ lists: true }` renders any series of forms without headings as an ordered list:

```javascript
assert.deepStrictEqual(
  html(
    {
      content: [
        {
          heading: 'First-Level Heading',
          form: {
            content: [
              'Here comes a list.',
              { form: { content: ['Apple'] } },
              { form: { content: ['Orange'] } },
              'And another one!',
              {
                form: {
                  content: [
                    'Red',
                    { form: { content: ['Red-Orange'] } },
                    { form: { content: ['Red-Yellow'] } }
                  ]
                }
              },
              { form: { content: ['Purple'] } },
              {
                form: {
                  content: [
                    { form: { content: ['More'] } },
                    { form: { content: ['Even More'] } }
                  ]
                }
              },
              'Last text!'
            ]
          }
        }
      ]
    },
    [],
    { html5: true, lists: true }
  ),
  [
    '<article>',
    '<section>',
    '<h1>First-Level Heading</h1>',
    '<p>Here comes a list.</p>',
    '<ol>',
    '<li><p>Apple</p></li>',
    '<li><p>Orange</p></li>',
    '</ol>',
    '<p>And another one!</p>',
    '<ol>',
    '<li>',
    '<p>Red</p>',
    '<ol>',
    '<li><p>Red-Orange</p></li>',
    '<li><p>Red-Yellow</p></li>',
    '</ol>',
    '</li>',
    '<li><p>Purple</p></li>',
    '<li>',
    '<ol>',
    '<li><p>More</p></li>',
    '<li><p>Even More</p></li>',
    '</ol>',
    '</li>',
    '</ol>',
    '<p>Last text!</p>',
    '</section>',
    '</article>'
  ]
    .join('')
)
```

The option `{ ids: true }` renders headings and references with IDs:

```javascript
assert.deepStrictEqual(
  html(
    {
      content: [
        {
          heading: 'First Heading',
          form: {
            content: [
              'first heading content'
            ]
          }
        },
        {
          heading: 'Second Heading',
          form: {
            content: [
              'reference to ',
              { reference: 'First Heading' }
            ]
          }
        }
      ]
    },
    [],
    { html5: true, ids: true }
  ),
  [
    '<article>',
    '<section>',
    '<h1 id="first-heading">First Heading</h1>',
    '<p>first heading content</p>',
    '</section>',
    '<section>',
    '<h1 id="second-heading">Second Heading</h1>',
    '<p>reference to <a href="#first-heading">First Heading</a></p>',
    '</section>',
    '</article>'
  ]
    .join('')
)
```

You can also set a title, edition, or both:

```javascript
assert.deepStrictEqual(
  html(
    { content: ['Hello, ', { blank: '' }] },
    [{ blank: ['content', 1], value: 'Joe' }],
    { title: 'Welcome' }
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

assert.deepStrictEqual(
  html(
    { content: ['Hello, ', { blank: '' }] },
    [{ blank: ['content', 1], value: 'Joe' }],
    { title: 'Welcome', edition: '1e' }
  ),
  [
    '<div class="article">',
    '<h1>Welcome</h1>',
    '<p class="edition">1e</p>',
    '<p>',
    'Hello, <span class="blank">Joe</span>',
    '</p>',
    '</div>'
  ]
    .join('')
)
```

Set `options.hash` to print the form hash at the top:

```javascript
assert.deepStrictEqual(
  html(
    { content: ['Hello, ', { blank: '' }] },
    [{ blank: ['content', 1], value: 'Joe' }],
    { title: 'Welcome', edition: '1e', hash: true }
  ),
  [
    '<div class="article">',
    '<h1>Welcome</h1>',
    '<p class="edition">1e</p>',
    '<p class="hash"><code>' +
      'd36c54da27de611b3a9ce7d08638bbd2' +
      '00cf5f3bb41d59320d04bba02ca48f85' +
      '</code></p>',
    '<p>',
    'Hello, <span class="blank">Joe</span>',
    '</p>',
    '</div>'
  ]
    .join('')
)
```

The option `{ classNames: ["test"] }` adds custom class names to the root element.

```javascript
assert.deepStrictEqual(
  html(
    { content: ['Hello, Joe.'] },
    [],
    { classNames: ['test'] }
  ),
  [
    '<div class="article test">',
    '<p>',
    'Hello, Joe.',
    '</p>',
    '</div>'
  ]
    .join('')
)

assert.deepStrictEqual(
  html(
    { content: ['Hello, Joe.'] },
    [],
    { html5: true, classNames: ['test'] }
  ),
  [
    '<article class="test">',
    '<p>',
    'Hello, Joe.',
    '</p>',
    '</article>'
  ]
    .join('')
)
```

The option `{ depth: n }` demotes all headings by `n` levels.  For example, `{ depth: 1 }` demotes `<h1>`s to `<h2>`s, and so on.

```javascript
assert.deepStrictEqual(
  html(
    {
      content: [
        {
          heading: 'A',
          form: { content: ['This is A'] }
        },
        {
          heading: 'B',
          form: { content: ['This is B'] }
        }
      ]
    },
    [],
    { depth: 2 }
  ),
  [
    '<div class="article">',
    '<div class="section">',
    '<h3>A</h3>',
    '<p>This is A</p>',
    '</div>',
    '<div class="section">',
    '<h3>B</h3>',
    '<p>This is B</p>',
    '</div>',
    '</div>'
  ]
    .join('')
)
```

Set `options.smartify` to replace ASCII punctuation with Unicode punctuation:

```javascript
assert.deepStrictEqual(
  html(
    { content: [{ use: 'Purchaser' }, "'s address is ", { blank: '' }] },
    //                                  ^ straight
    [],
    { smartify: true }
  ),
  [
    '<div class="article">',
    '<p>',
    '<span class="term">Purchaser</span>’s ',
    //                                  ^ curly
    'address is ',
    '<span class="blank">[•]</span>',
    '</p>',
    '</div>'
  ]
    .join('')
)
```

The option `{ annotations: [] }` renders annotations in context.

```javascript
assert.deepStrictEqual(
  html(
    {
      content: [
        {
          heading: 'A',
          form: { content: ['This is A'] }
        },
        {
          heading: 'B',
          form: { content: ['This is B'] }
        },
        {
          heading: 'C',
          form: {
            content: [
              { form: { content: ['1'] } },
              { form: { content: ['2'] } },
              { form: { content: ['3'] } }
            ]
          }
        }
      ]
    },
    [],
    {
      lists: true,
      annotations: [
        {
          path: ['content', 0, 'form', 'content', 0],
          level: 'info',
          message: 'Annotation to A.'
        },
        {
          path: ['content', 1, 'form', 'content', 0],
          level: 'error',
          message: 'Annotation to B.'
        },
        {
          path: ['content', 2, 'form', 'content', 1, 'form', 'content', 0],
          level: 'error',
          message: 'Annotation to 2.'
        }
      ]
    }
  ),
  [
    '<div class="article">',
    '<div class="section">',
    '<h1>A</h1>',
    '<div class="annotation info"><p>Annotation to A.</p></div>',
    '<p>This is A</p>',
    '</div>',
    '<div class="section">',
    '<h1>B</h1>',
    '<div class="annotation error"><p>Annotation to B.</p></div>',
    '<p>This is B</p>',
    '</div>',
    '<div class="section">',
    '<h1>C</h1>',
    '<ol>',
    '<li><p>1</p></li>',
    '<li>',
    '<div class="annotation error"><p>Annotation to 2.</p></div>',
    '<p>2</p>',
    '</li>',
    '<li><p>3</p></li>',
    '</ol>',
    '</div>',
    '</div>'
  ]
    .join('')
)
```

With `{ html5: true }`, annotations render as `<aside>`s.

```javascript
assert.deepStrictEqual(
  html(
    {
      content: [
        {
          heading: 'A',
          form: { content: ['This is A'] }
        },
        {
          heading: 'B',
          form: { content: ['This is B'] }
        },
        {
          heading: 'C',
          form: {
            content: [
              { form: { content: ['1'] } },
              { form: { content: ['2'] } },
              { form: { content: ['3'] } }
            ]
          }
        }
      ]
    },
    [],
    {
      html5: true,
      lists: true,
      annotations: [
        {
          path: ['content', 0, 'form', 'content', 0],
          level: 'info',
          message: 'Annotation to A.'
        },
        {
          path: ['content', 1, 'form', 'content', 0],
          level: 'error',
          message: 'Annotation to B.'
        },
        {
          path: ['content', 2, 'form', 'content', 1, 'form', 'content', 0],
          level: 'error',
          message: 'Annotation to 2.'
        }
      ]
    }
  ),
  [
    '<article>',
    '<section>',
    '<h1>A</h1>',
    '<aside class="annotation info"><p>Annotation to A.</p></aside>',
    '<p>This is A</p>',
    '</section>',
    '<section>',
    '<h1>B</h1>',
    '<aside class="annotation error"><p>Annotation to B.</p></aside>',
    '<p>This is B</p>',
    '</section>',
    '<section>',
    '<h1>C</h1>',
    '<ol>',
    '<li><p>1</p></li>',
    '<li>',
    '<aside class="annotation error"><p>Annotation to 2.</p></aside>',
    '<p>2</p>',
    '</li>',
    '<li><p>3</p></li>',
    '</ol>',
    '</section>',
    '</article>'
  ]
    .join('')
)
```

Annotations to the root of the form appear just within the root element:

```javascript
var lint = require('commonform-lint')
var form = { content: ['See ', { reference: 'Nonexistent' }] }
var annotations = lint(form)
assert.deepStrictEqual(
  html(form, [], {
    html5: true,
    lists: true,
    annotations: annotations
  }),
  [
    '<article>',
    '<aside class="annotation error">',
    '<p>The heading &quot;Nonexistent&quot; is referenced, but not used.</p>',
    '</aside>',
    '<p>See <span class="reference">Nonexistent</span></p>',
    '</article>'
  ]
    .join('')
)
```

Supports components:

```javascript
assert.deepStrictEqual(
  html(
    {
      content: [
        {
          heading: 'License Grant',
          repository: 'commonform.org',
          publisher: 'kemitchell',
          project: 'apache-style-license-grant',
          edition: '1e',
          upgrade: 'yes',
          substitutions: {
            terms: {
              Licensor: 'Vendor',
              Licensee: 'Customer',
              Program: 'Software'
            },
            headings: {
              'Express Warranties': 'Guarantees'
            }
          }
        }
      ]
    },
    [],
    {
      html5: true,
      lists: true
    }
  ),
  [
    '<article>',
    '<section class="component">',
    '<h1>License Grant</h1>',
    '<p>',
    '<a href="https://commonform.org/kemitchell/apache-style-license-grant/1e">',
    'https://commonform.org/kemitchell/apache-style-license-grant/1e',
    '</a>',
    ' with updates and corrections,',
    ' replacing ',
    '<span class="use">Licensor</span>',
    ' with ',
    '<span class="use">Vendor</span>',
    ', ',
    '<span class="use">Licensee</span>',
    ' with ',
    '<span class="use">Customer</span>',
    ', ',
    '<span class="use">Program</span>',
    ' with ',
    '<span class="use">Software</span>',
    ', ',
    '<span class="reference">Express Warranties</span>',
    ' with ',
    '<span class="reference">Guarantees</span>',
    '</p>',
    '</section>',
    '</article>'
  ]
    .join('')
)

assert.deepStrictEqual(
  html(
    {
      content: [
        {
          repository: 'commonform.org',
          publisher: 'kemitchell',
          project: 'apache-style-license-grant',
          edition: '1e',
          substitutions: {
            terms: {
              Licensor: 'Vendor',
              Licensee: 'Customer',
              Program: 'Software'
            },
            headings: {
              'Express Warranties': 'Guarantees'
            }
          }
        }
      ]
    },
    [],
    {
      html5: true,
      lists: true
    }
  ),
  [
    '<article>',
    '<ol>',
    '<li class="component">',
    '<p>',
    '<a href="https://commonform.org/kemitchell/apache-style-license-grant/1e">',
    'https://commonform.org/kemitchell/apache-style-license-grant/1e',
    '</a>',
    ' replacing ',
    '<span class="use">Licensor</span>',
    ' with ',
    '<span class="use">Vendor</span>',
    ', ',
    '<span class="use">Licensee</span>',
    ' with ',
    '<span class="use">Customer</span>',
    ', ',
    '<span class="use">Program</span>',
    ' with ',
    '<span class="use">Software</span>',
    ', ',
    '<span class="reference">Express Warranties</span>',
    ' with ',
    '<span class="reference">Guarantees</span>',
    '</p>',
    '</li>',
    '</ol>',
    '</article>'
  ]
    .join('')
)
```

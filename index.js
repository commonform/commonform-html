var GitHubSlugger = require('github-slugger')
var escape = require('escape-html')
var group = require('commonform-group-series')
var has = require('has')
var hash = require('commonform-hash')
var predicate = require('commonform-predicate')

function renderParagraph (paragraph, offset, path, blanks, options) {
  var html5 = options.html5
  return (
    '<p>' +
    paragraph.content
      .map(function (element, index) {
        if (predicate.text(element)) {
          return escape(element)
        } else if (predicate.use(element)) {
          return (
            '<span class="term">' +
              escape(element.use) +
            '</span>'
          )
        } else if (predicate.definition(element)) {
          return (
            (html5 ? '<dfn>' : '<span class="definition">') +
              escape(element.definition) +
            (html5 ? '</dfn>' : '</span>')
          )
        } else if (predicate.blank(element)) {
          var elementPath = path.concat('content', offset + index)
          var value = matchingValue(elementPath, blanks)
          return (
            '<span class="blank">' +
              (value ? escape(value) : escape('[•]')) +
            '</span>'
          )
        } else if (predicate.reference(element)) {
          var heading = element.reference
          if (options.ids) {
            options.referenceSlugger.reset()
            var slug = options.referenceSlugger.slug(heading)
            return (
              '<a href="#' + slug + '">' +
                escape(heading) +
              '</a>'
            )
          } else {
            return (
              '<span class="reference">' +
                escape(heading) +
              '</span>'
            )
          }
        }
      })
      .join('') +
    '</p>'
  )
}

function matchingValue (path, blanks) {
  var length = blanks.length
  for (var index = 0; index < length; index++) {
    var blank = blanks[index]
    if (equal(blank.blank, path)) {
      return blank.value
    }
  }
}

function heading (depth, text, options) {
  var id = options.ids
    ? ' id="' + encodeURIComponent(
      options.headingSlugger.slug(text)
    ) + '"'
    : ''
  if (depth <= 6) {
    return (
      '<h' + depth + id + '>' +
        escape(text) +
      '</h' + depth + '>'
    )
  } else {
    return (
      '<span class="h' + depth + '"' + id + '>' +
        escape(text) +
      '</span>'
    )
  }
}

function renderSeries (depth, offset, path, series, blanks, options) {
  var simple = options.lists && !series.content.some(containsAHeading)
  var html5 = options.html5
  if (simple) {
    return (
      '<ol>' +
      series.content
        .map(function (child, index) {
          return (
            (
              child.form.conspicuous
                ? '<li class="conspicuous">'
                : '<li>'
            ) +
              renderForm(
                depth,
                path.concat('content', offset + index, 'form'),
                child.form,
                blanks,
                options
              ) +
            '</li>'
          )
        })
        .join('') +
      '</ol>'
    )
  } else {
    return series.content
      .map(function (child, index) {
        return (
          (
            html5
              ? child.form.conspicuous
                ? '<section class="conspicuous">'
                : '<section>'
              : child.form.conspicuous
                ? '<div class="section conspicuous">'
                : '<div class="section">'
          ) +
          ('heading' in child ? heading(depth, child.heading, options) : '') +
            renderForm(
              depth,
              path.concat('content', offset + index, 'form'),
              child.form,
              blanks,
              options
            ) +
          (html5 ? '</section>' : '</div>')
        )
      })
      .join('')
  }
}

function renderForm (depth, path, form, blanks, options) {
  var offset = 0
  return group(form)
    .map(function (group) {
      var returned = group.type === 'series'
        ? renderSeries(
          depth + 1, offset, path, group, blanks, options
        )
        : renderParagraph(group, offset, path, blanks, options)
      offset += group.content.length
      return returned
    })
    .join('')
}

module.exports = function commonformHTML (form, blanks, options) {
  blanks = blanks || []
  options = options || {}
  var html5 = options.html5
  var title = options.title
  var edition = options.edition
  var className = options.className || ''
  if (options.ids) {
    options.headingSlugger = new GitHubSlugger()
    options.referenceSlugger = new GitHubSlugger()
  }
  var classNames = []
  if (!html5) classNames.push('article')
  if (form.conspicuous) classNames.push('conspicuous')
  if (className) classNames.push(className)
  return (
    (
      html5
        ? classNames.length === 0
          ? '<article>'
          : '<article class="' + classNames.join(' ') + '">'
        : '<div class="' + classNames.join(' ') + '">'
    ) +
    (title ? ('<h1>' + escape(title) + '</h1>') : '') +
    (edition ? ('<p class="edition">' + escape(edition) + '</p>') : '') +
    (
      options.hash
        ? ('<p class="hash"><code>' + hash(form) + '</code></p>')
        : ''
    ) +
    renderForm((title ? 1 : 0), [], form, blanks, options) +
    (html5 ? '</article>' : '</div>')
  )
}

function equal (a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every(function (_, index) {
      return a[index] === b[index]
    })
  )
}

function containsAHeading (child) {
  return (
    has(child, 'heading') ||
    child.form.content.some(function (element) {
      return (
        has(element, 'form') &&
        containsAHeading(element)
      )
    })
  )
}

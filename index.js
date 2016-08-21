var escape = require('escape-html')
var equal = require('deep-equal')
var group = require('commonform-group-series')
var predicate = require('commonform-predicate')

function renderParagraph (paragraph, offset, path, blanks, html5) {
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
        return (
          '<span class="reference">' +
          escape(element.reference) +
          '</span>'
        )
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

function heading (depth, text) {
  if (depth <= 6) {
    return (
      '<h' + depth + '>' +
      escape(text) +
      '</h' + depth + '>'
    )
  } else {
    return (
      '<span class="h' + depth + '">' +
      escape(text) +
      '</span>'
    )
  }
}

function renderSeries (depth, offset, path, series, blanks, html5) {
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
      ('heading' in child ? heading(depth, child.heading) : '') +
      renderForm(
        depth,
        path.concat('content', offset + index, 'form'),
        child.form,
        blanks, html5
      ) +
      (html5 ? '</section>' : '</div>')
    )
  })
  .join('')
}

function renderForm (depth, path, form, blanks, html5) {
  var offset = 0
  return group(form)
  .map(function (group) {
    var returned = group.type === 'series'
    ? renderSeries(depth + 1, offset, path, group, blanks, html5)
    : renderParagraph(group, offset, path, blanks, html5)
    offset += group.content.length
    return returned
  })
  .join('')
}

module.exports = function commonformHTML (form, blanks, options) {
  if (!blanks) {
    blanks = []
  }
  if (!options) {
    options = {}
  }
  var html5 = 'html5' in options && options.html5 === true
  var title = 'title' in options ? options.title : false
  return (
    (
      html5
      ? form.conspicuous
        ? '<article class="conspicuous">'
        : '<article>'
      : form.conspicuous
        ? '<div class="article conspicuous">'
        : '<div class="article">'
    ) +
    (title ? ('<h1>' + escape(title) + '</h1>') : '') +
    renderForm((title ? 1 : 0), [], form, blanks, html5) +
    (html5 ? '</article>' : '</div>')
  )
}

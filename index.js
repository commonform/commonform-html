var GitHubSlugger = require('github-slugger')
var englishList = require('english-list')
var escape = require('escape-html')
var group = require('commonform-group-series')
var has = require('has')
var hash = require('commonform-hash')
var predicate = require('commonform-predicate')
var smartify = require('commonform-smartify')

function renderParagraph (paragraph, offset, path, blanks, options) {
  var html5 = options.html5
  return (
    '<p>' +
    paragraph.content
      .map(function (element, index) {
        if (predicate.text(element)) {
          return escape(element)
        } else if (predicate.use(element)) {
          return renderUse(element.use)
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
          return renderReference(element.reference, options)
        }
      })
      .join('') +
    '</p>'
  )
}

function renderUse (term) {
  return (
    '<span class="term">' +
      escape(term) +
    '</span>'
  )
}

function renderReference (heading, options) {
  if (options.ids) {
    options.referenceSlugger.reset()
    var slug = options.referenceSlugger.slug(heading)
    return (
      '<a class="reference" href="#' + slug + '">' +
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
          var childPath = path.concat('content', offset + index, 'form')
          var classes = []
          var component = predicate.component(child)
          if (component) classes.push('component')
          if (!component && child.form.conspicuous) {
            classes.push('conspicuous')
          }
          return (
            (
              classes.length > 0
                ? '<li class="' + classes.join(' ') + '">'
                : '<li>'
            ) +
            (
              component
                ? (
                  renderComponent(
                    depth,
                    childPath,
                    child,
                    blanks,
                    options
                  )
                )
                : renderChild(depth, childPath, child.form, blanks, options)
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
        var childPath = path.concat('content', offset + index, 'form')
        var classes = []
        var component = predicate.component(child)
        if (component) classes.push('component')
        if (!component && child.form.conspicuous) {
          classes.push('conspicuous')
        }
        if (!html5) classes.push('section')
        return (
          (
            html5
              ? classes.length > 0
                ? '<section class="' + classes.join(' ') + '">'
                : '<section>'
              : '<div class="' + classes.join(' ') + '">'
          ) +
            ('heading' in child ? heading(depth, child.heading, options) : '') +
            (
              component
                ? (
                  renderComponent(
                    depth,
                    childPath,
                    child,
                    blanks,
                    options
                  )
                )
                : renderChild(depth, childPath, child.form, blanks, options)
            ) +
          (html5 ? '</section>' : '</div>')
        )
      })
      .join('')
  }
}

function renderChild (depth, path, form, blanks, options) {
  return (
    renderAnnotations(path, options.annotations, options) +
    renderForm(depth, path, form, blanks, options)
  )
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

function renderComponent (depth, path, component, blanks, options) {
  if (has(component, 'form')) {
    return renderLoadedComponent(depth, path, component, blanks, options)
  } else {
    return renderComponentReference(depth, path, component, blanks, options)
  }
}

function renderLoadedComponent (depth, path, component, blanks, options) {
  var style = options.loadedComponentStyle
  if (style === 'copy') {
    return renderChild(depth, path, component.form, blanks, options)
  } else if (style === 'reference') {
    return renderLoadedComponentReference(depth, path, component, blanks, options)
  } else if (style === 'both') {
    return renderLoadedComponentBoth(depth, path, component, blanks, options)
  } else {
    throw new Error('Uknown loaded component display style: ' + style)
  }
}

function renderLoadedComponentReference (depth, path, component, blanks, options) {
  var returned = '<p>' + options.incorporateComponentText
  returned += ' '
  var url = component.reference.component + '/' + component.reference.version
  returned += '<a href="' + url + '">'
  var meta = component.component
  returned += meta.publisher
  returned += ' '
  returned += meta.name
  returned += ' '
  returned += meta.version
  returned += '</a>'
  var substitutions = component.reference.substitutions
  var hasSubstitutions = (
    Object.keys(substitutions.terms).length > 0 ||
    Object.keys(substitutions.headings).length > 0 ||
    Object.keys(substitutions.blanks).length > 0
  )
  if (hasSubstitutions) {
    returned += ' substituting:</p>'
    returned += renderSubstitutions(component.reference.substitutions, options)
  } else {
    returned += '.</p>'
  }
  return returned
}

function renderLoadedComponentBoth (depth, path, component, blanks, options) {
  var returned = renderLoadedComponentReference(depth, path, component, blanks, options)
  returned += '<p>'
  returned += options.quoteComponentText
  returned += '</p>'
  returned += renderAnnotations(path, options.annotations, options)
  returned += '<blockquote>'
  returned += renderForm(depth, path, component.form, blanks, options)
  returned += '</blockquote>'
  return returned
}

function renderComponentReference (depth, path, component, blanks, options) {
  var url = component.component + '/' + component.version
  var substitutions = component.substitutions
  var hasSubstitutions = (
    Object.keys(substitutions.terms).length > 0 ||
    Object.keys(substitutions.headings).length > 0 ||
    Object.keys(substitutions.blanks).length > 0
  )
  var returned = '<p>' + (options.incorporate || 'Incorporate') + ' <a href="' + url + '">' + url + '</a>'
  if (hasSubstitutions) {
    returned += ' substituting:</p>'
    returned += renderSubstitutions(substitutions, options)
  } else {
    returned += '.</p>'
  }
  return returned
}

function renderSubstitutions (substitutions, options) {
  return '<ul>' +
    Object.keys(substitutions.terms).sort().map(function (from) {
      var to = substitutions.terms[from]
      return '<li>the term ' + quote(to) + ' for the term ' + quote(from) + '</li>'
    }).join('') +
    Object.keys(substitutions.headings).sort().map(function (from) {
      var to = substitutions.headings[from]
      return '<li>references to ' + quote(to) + ' for references to ' + quote(from) + '</li>'
    }).join('') +
    Object.keys(substitutions.blanks)
      .sort(function (a, b) { return parseInt(a) - parseInt(b) })
      .map(function (number) {
        var value = substitutions.blanks[number]
        return '<li>' + quote(value) + ' for blank ' + number + '</li>'
      }).join('') +
    '</ul>'

  function quote (string) {
    if (options.smartify) return '“' + string + '”'
    else return '"' + string + '"'
  }
}

function renderAnnotations (path, annotations, options) {
  var tag = options.html5 ? 'aside' : 'div'
  return annotations
    .filter(function (annotation) {
      return equal(annotation.path.slice(0, -2), path)
    })
    .map(function (annotation) {
      var classNames = ['annotation', annotation.level]
      var paragraph = '<p>' + escape(annotation.message) + '</p>'
      return [
        '<' + tag + ' class="' + classNames.sort().join(' ') + '">',
        paragraph,
        '</' + tag + '>'
      ].join('')
    })
    .join('')
}

module.exports = function commonformHTML (form, blanks, options) {
  blanks = blanks || []
  options = options || {}
  var html5 = options.html5
  var title = options.title
  var version = options.version
  var depth = options.depth || 0
  var classNames = options.classNames || []
  if (!options.quoteComponentText) {
    options.quoteComponentText = 'Quoting for convenience, with any conflicts resolved in favor of the standard:'
  }
  if (!options.incorporateComponentText) {
    options.incorporateComponentText = 'Incorporate'
  }
  options.annotations = options.annotations || []
  if (options.ids) {
    options.headingSlugger = new GitHubSlugger()
    options.referenceSlugger = new GitHubSlugger()
  }
  if (!html5) classNames.push('article')
  if (form.conspicuous) classNames.push('conspicuous')
  classNames.sort()
  if (title) depth++
  return (
    (
      html5
        ? classNames.length === 0
          ? '<article>'
          : '<article class="' + classNames.join(' ') + '">'
        : '<div class="' + classNames.join(' ') + '">'
    ) +
    (title ? ('<h1>' + escape(title) + '</h1>') : '') +
    (version ? ('<p class="version">' + escape(version) + '</p>') : '') +
    (
      options.hash
        ? ('<p class="hash"><code>' + hash(form) + '</code></p>')
        : ''
    ) +
    renderAnnotations([], options.annotations, options) +
    renderForm(depth, [], options.smartify ? smartify(form) : form, blanks, options) +
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
    (
      has(child, 'form') &&
      child.form.content.some(function (element) {
        return (
          has(element, 'form') &&
          containsAHeading(element)
        )
      })
    )
  )
}

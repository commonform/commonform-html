const GitHubSlugger = require('github-slugger')
const escape = require('escape-html')
const group = require('commonform-group-series')
const has = require('has')
const hash = require('commonform-hash')
const numberToWords = require('number-to-words-en')
const predicate = require('commonform-predicate')
const smartify = require('commonform-smartify')

function renderParagraph (paragraph, offset, path, blanks, options) {
  const html5 = options.html5
  return (
    '<p>' +
    paragraph.content
      .map((element, index) => {
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
          const elementPath = path.concat('content', offset + index)
          const value = matchingValue(elementPath, blanks)
          return (
            '<span class="blank">' +
            (value ? escape(value) : escape('[•]')) +
            '</span>'
          )
        } else /* if (predicate.reference(element)) */{
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
    const slug = options.referenceSlugger.slug(heading)
    return `<a class="reference" href="#${slug}">${escape(heading)}</a>`
  } else {
    return `<span class="reference">${escape(heading)}</span>`
  }
}

function matchingValue (path, blanks) {
  for (const blank of blanks) {
    if (equal(blank.blank, path)) {
      return blank.value
    }
  }
}

function heading (depth, text, options) {
  const id = options.ids
    ? ` id="${encodeURIComponent(options.headingSlugger.slug(text))}"`
    : ''
  if (depth <= 6) {
    return `<h${depth}${id}>${escape(text)}</h${depth}>`
  } else {
    return `<span class="h${depth}"${id}>${escape(text)}</span>`
  }
}

function renderSeries (depth, offset, path, series, blanks, options) {
  const simple = options.lists && !series.content.some(containsAHeading)
  const html5 = options.html5
  if (simple) {
    return (
      '<ol>' +
      series.content
        .map(function (child, index) {
          const childPath = path.concat('content', offset + index, 'form')
          const classes = []
          const component = predicate.component(child)
          if (component) classes.push('component')
          if (!component && child.form.conspicuous) {
            classes.push('conspicuous')
          }
          return (
            (
              classes.length > 0
                ? `<li class="${classes.join(' ')}">`
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
      .map((child, index) => {
        const childPath = path.concat('content', offset + index, 'form')
        const classes = []
        const component = predicate.component(child)
        if (component) classes.push('component')
        if (!component && child.form.conspicuous) {
          classes.push('conspicuous')
        }
        if (!html5) classes.push('section')
        return (
          (
            html5
              ? classes.length > 0
                ? `<section class="${classes.join(' ')}">`
                : '<section>'
              : `<div class="${classes.join(' ')}">`
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
  let offset = 0
  return group(form)
    .map(group => {
      const returned = group.type === 'series'
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
  const style = options.loadedComponentStyle
  if (style === 'copy') {
    return renderChild(depth, path, component.form, blanks, options)
  } else if (style === 'reference') {
    return renderLoadedComponentReference(depth, path, component, blanks, options)
  } else if (style === 'both') {
    return renderLoadedComponentBoth(depth, path, component, blanks, options)
  } else {
    throw new Error(`Unknown loaded component display style: ${style}`)
  }
}

function renderLoadedComponentReference (depth, path, component, blanks, options) {
  let returned = '<p>' + escape(options.incorporateComponentText)
  returned += ' '
  const url = component.reference.component + '/' + component.reference.version
  returned += `<a href="${url}">`
  const meta = component.component
  returned += `${meta.publisher} ${meta.name} Version ${meta.version}`
  returned += '</a>'
  const substitutions = component.reference.substitutions
  const hasSubstitutions = (
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
  let returned = renderLoadedComponentReference(depth, path, component, blanks, options)
  returned += `<p>${escape(options.quoteComponentText)}</p>`
  returned += renderAnnotations(path, options.annotations, options)
  returned += '<blockquote>'
  returned += renderForm(depth, path, component.form, blanks, options)
  returned += '</blockquote>'
  return returned
}

function renderComponentReference (depth, path, component, blanks, options) {
  const url = component.component + '/' + component.version
  const substitutions = component.substitutions
  const hasSubstitutions = (
    Object.keys(substitutions.terms).length > 0 ||
    Object.keys(substitutions.headings).length > 0 ||
    Object.keys(substitutions.blanks).length > 0
  )
  let returned = `<p>${escape(options.incorporateComponentText)} <a href="${url}">${url}</a>`
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
    Object.keys(substitutions.terms).sort().map(from => {
      const to = substitutions.terms[from]
      return `<li>the term ${renderUse(to)} for the term ${renderUse(from)}</li>`
    }).join('') +
    Object.keys(substitutions.headings).sort().map(from => {
      const to = substitutions.headings[from]
      return `<li>references to ${renderReference(to, options)} for references to ${renderReference(from, { ids: false })}</li>`
    }).join('') +
    Object.keys(substitutions.blanks)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(number => {
        const value = substitutions.blanks[number]
        return `<li>${quote(value)} for the ${numberToWords.toWordsOrdinal(parseInt(number))} blank</li>`
      }).join('') +
    '</ul>'

  function quote (string) {
    return options.smartify ? `“${string}”` : `"${string}"`
  }
}

function renderAnnotations (path, annotations, options) {
  const tag = options.html5 ? 'aside' : 'div'
  return annotations
    .filter(annotation => {
      return equal(annotation.path.slice(0, -2), path)
    })
    .map(annotation => {
      const classNames = ['annotation', annotation.level]
      const paragraph = `<p>${escape(annotation.message)}</p>`
      return `<${tag} class="${classNames.sort().join(' ')}">${paragraph}</${tag}>`
    })
    .join('')
}

module.exports = function (form, blanks, options) {
  blanks = blanks || []
  options = options || {}
  const html5 = options.html5
  const title = options.title
  const version = options.version
  let depth = options.depth || 0
  const classNames = options.classNames || []
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
          : `<article class="${classNames.join(' ')}">`
        : `<div class="${classNames.join(' ')}">`
    ) +
    (title ? (`<h1>${escape(title)}</h1>`) : '') +
    (version ? (`<p class="version">${escape(version)}</p>`) : '') +
    (
      options.hash
        ? (`<p class="hash"><code>${hash(form)}</code></p>`)
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
    a.every((_, index) => a[index] === b[index])
  )
}

function containsAHeading (child) {
  return (
    has(child, 'heading') ||
    (
      has(child, 'form') &&
      child.form.content.some(element => has(element, 'form') && containsAHeading(element))
    )
  )
}

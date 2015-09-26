var escape = require('escape-html')
var group = require('commonform-group-series')
var predicate = require('commonform-predicate')
var urlRegex = require('url-regex')

function linkifyOne(text, link) {
  return text.replace(link, "<a href=\"" + link + "\">" + link + "</a>")
}

function linkify(text) {
  console.log("linkify() called")
  if (urlRegex().test(text)) {
    var matches = text.match(urlRegex())
    matches.forEach( function(link) { text = linkifyOne(text, link) } )
    return text
  } else {
    return text
  }
}

function renderParagraph(paragraph, blanks, html5) {
  return  (
    '<p>' +
    paragraph.content
      .map(function(element) {
        if (predicate.text(element)) {
          return escape(linkify(element)) }
        else if (predicate.use(element)) {
          return (
            '<span class="term">' +
            escape(element.use) +
            '</span>' ) }
        else if (predicate.definition(element)) {
          return (
            ( html5 ? '<dfn>' : '<span class="definition">' ) +
            escape(element.definition) +
            ( html5 ? '</dfn>' : '</span>' ) ) }
        else if (predicate.blank(element)) {
          return (
            '<span class="blank">' +
            ( element.blank in blanks ?
              escape(blanks[linkify(element.blank)]) :
              escape(linkify(element.blank)) ) +
            '</span>' ) }
        else if (predicate.reference(element)) {
          return (
            '<span class="reference">' +
            escape(element.reference) +
            '</span>' ) } })
        .join('') +
    '</p>' ) }

function heading(depth, text) {
  if (depth <= 6) {
    return (
      '<h' + depth + '>' +
      escape(text) +
      '</h' + depth + '>' ) }
  else {
    return (
      '<span class="h' + depth + '">' +
      escape(text) +
      '</span>' ) } }

function renderSeries(depth, series, blanks, html5) {
  return series.content
    .map(function(child) {
      return (
        ( html5 ?
          ( child.form.conspicuous ?
              '<section class="conspicuous">' :
              '<section>' ) :
          ( child.form.conspicuous ?
              '<div class="section conspicuous">' :
              '<div class="section">' ) ) +
        ( 'heading' in child ? heading(depth, child.heading) : '' ) +
        renderForm(depth, child.form, blanks, html5) +
        ( html5 ? '</section>' : '</div>' ) ) })
      .join('') }

function renderForm(depth, form, blanks, html5) {
  return group(form)
    .map(function(group) {
      return (
        group.type === 'series' ?
          renderSeries(( depth + 1 ), group, blanks, html5) :
          renderParagraph(group, blanks, html5) ) })
    .join('') }

module.exports = function commonformHTML(form, blanks, options) {
  if (!blanks) {
    blanks = { } }
  if (!options) {
    options = { } }
  var html5 = ( 'html5' in options && options.html5 === true )
  var title = ( 'title' in options ?
    options.title : false )
  return (
    ( html5 ?
      ( form.conspicuous ?
          '<article class="conspicuous">' :
          '<article>' ) :
      ( form.conspicuous ?
          '<div class="article conspicuous">' :
          '<div class="article">' ) ) +
    ( title ? ( '<h1>' + escape(title) + '</h1>' ) : '' ) +
    renderForm(( title ? 1 : 0 ), form, blanks, html5) +
    ( html5 ? '</article>' : '</div>' ) ) }

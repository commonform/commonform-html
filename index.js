var escape = require('escape-html')
var group = require('commonform-group-series')
var predicate = require('commonform-predicate')

function renderParagraph(paragraph, blanks, html5) {
  return  (
    '<p>' +
    paragraph.content
      .map(function(element) {
        if (predicate.text(element)) {
          return escape(element) }
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
              escape(blanks[element.blank]) :
              escape(element.blank) ) +
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
      '<span class="h' + tag + '">' +
      escape(text) +
      '</span>' ) } }

function renderSeries(depth, series, blanks, html5) {
  return series.content
    .map(function(child) {
      return (
        ( html5 ? '<section>' : '<div class="section">' ) +
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
    ( html5 ? '<article>' : '<div class="article">' ) +
    ( title ? ( '<h1>' + escape(title) + '</h1>' ) : '' ) +
    renderForm(( title ? 1 : 0 ), form, blanks, html5) +
    ( html5 ? '</article>' : '</div>' ) ) }

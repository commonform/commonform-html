#!/usr/bin/env node
if (module.parent) {
  module.exports = bin
} else {
  bin(
    process.stdin,
    process.stdout,
    process.stderr,
    process.argv.slice(1),
    function (status) {
      process.exit(status)
    }
  )
}

function bin (stdin, stdout, stderr, argv, done) {
  var args = require('yargs')
    .scriptName('commonform-html')
    .option('html5', {
      describe: 'output HTML5',
      type: 'boolean'
    })
    .option('lists', {
      alias: 'l',
      describe: 'output lists',
      type: 'boolean'
    })
    .option('title', {
      alias: 't',
      describe: 'form title',
      type: 'string'
    })
    .option('edition', {
      alias: 'e',
      describe: 'form edition',
      type: 'string'
    })
    .option('values', {
      alias: 'v',
      describe: 'JSON file with blank values',
      normalize: true,
      demandOption: false
    })
    .option('directions', {
      alias: 'd',
      describe: 'JSON file with directions',
      normalize: true,
      demandOption: false
    })
    .implies('directions', 'values')
    .coerce({
      values: readJSON,
      directions: readJSON
    })
    .version()
    .help()
    .alias('h', 'help')
    .parse(argv)

  // Prepare fill-in-the-blank values.
  var directions = args.directions
  var values = args.values
  if (directions && !Array.isArray(directions)) {
    stderr.write('Directions must be an array.\n')
    return done(1)
  }
  var blanks = []
  if (values) {
    if (Array.isArray(values)) {
      blanks = values
    } else {
      Object.keys(values).forEach(function (label) {
        var value = values[label]
        directions.forEach(function (direction) {
          if (direction.label !== label) return
          blanks.push({ value: value, blank: direction.blank })
        })
      })
    }
  }

  // Prepare rendering options.
  var options = {}
  if (args.edition) options.edition = args.edition
  if (args.title) options.title = args.title
  if (args.html5) options.html5 = true
  if (args.lists) options.lists = true

  // Read the form to be rendered.
  var chunks = []
  stdin
    .on('data', function (chunk) {
      chunks.push(chunk)
    })
    .once('error', function (error) {
      return fail(error)
    })
    .once('end', function () {
      var buffer = Buffer.concat(chunks)
      try {
        var form = JSON.parse(buffer)
      } catch (error) {
        return fail(error)
      }

      // Render.
      try {
        var rendered = require('./')(form, blanks, options)
      } catch (error) {
        return fail(error)
      }
      stdout.write(rendered + '\n')
      return done(0)
    })

  function fail (error) {
    stderr.write(error.toString() + '\n')
    done(1)
  }
}

function readJSON (file) {
  return JSON.parse(require('fs').readFileSync(file))
}
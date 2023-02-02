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
  const args = require('yargs')
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
    .option('complete', {
      alias: 'c',
      describe: 'throw an error if a blank does not have a value',
      type: 'boolean'
    })
    .option('ids', {
      alias: 'i',
      describe: 'output headings with IDs',
      type: 'boolean'
    })
    .option('title', {
      alias: 't',
      describe: 'form title',
      type: 'string'
    })
    .option('form-version', {
      alias: 'e',
      describe: 'form version',
      type: 'string'
    })
    .option('values', {
      alias: 'v',
      describe: 'JSON file with blank values',
      coerce: readJSON,
      demandOption: false
    })
    .option('directions', {
      alias: 'd',
      describe: 'JSON file with directions',
      coerce: readJSON,
      demandOption: false
    })
    .implies('directions', 'values')
    .option('smartify', {
      describe: 'output Unicode punctuation',
      type: 'boolean'
    })
    .options('component-style', {
      describe: 'how to render components',
      default: 'both',
      choices: ['copy', 'reference', 'both']
    })
    .option('quote-component-text', {
      description: 'text before quoted component contents'
    })
    .option('incorporate-component-text', {
      description: 'text before component references',
      default: 'Incorporate'
    })
    .version()
    .help()
    .alias('h', 'help')
    .parse(argv)

  // Prepare fill-in-the-blank values.
  const blanks = (args.values && args.directions)
    ? require('commonform-prepare-blanks')(
      args.values, args.directions
    )
    : []

  // Prepare rendering options.
  const options = {
    loadedComponentStyle: args['component-style']
  }
  if (args['form-version']) options.version = args['form-version']
  if (args.title) options.title = args.title
  if (args.html5) options.html5 = true
  if (args.lists) options.lists = true
  if (args.complete) options.complete = true
  if (args.ids) options.ids = true
  if (args.smartify) options.smartify = true
  if (args['quote-component-text']) options.quoteComponentText = args['quote-component-text']
  if (args['incorporate-component-text']) options.incorporateComponentText = args['incorporate-component-text']

  // Read the form to be rendered.
  const chunks = []
  stdin
    .on('data', function (chunk) {
      chunks.push(chunk)
    })
    .once('error', function (error) {
      return fail(error)
    })
    .once('end', function () {
      const buffer = Buffer.concat(chunks)
      let form
      try {
        form = JSON.parse(buffer)
      } catch (error) {
        return fail(error)
      }

      // Render.
      let rendered
      try {
        rendered = require('./')(form, blanks, options)
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
  return JSON.parse(
    require('fs').readFileSync(
      require('path').normalize(file)
    )
  )
}

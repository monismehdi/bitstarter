#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs')
  , program = require('commander')
  , cheerio = require('cheerio')
  , rest = require('restler')
  , HTMLFILE_DEFAULT = 'index.html'
  , CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if ( ! fs.existsSync(instr)) {
    console.log('%s does not exist. Exiting.', instr);
    process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
  }
  return instr;
};

var cheerioHtmlFile = function(htmlfile) {
  return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var runChecks = function(cheerio_fn, checksfile) {
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for (var ii in checks) {
    var present = cheerio_fn(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var checkHtmlFile = function(htmlfile, checksfile, output_cb) {
  var $ = cheerioHtmlFile(htmlfile);
  output_cb(runChecks($, checksfile));
};

var checkUrl = function(url, checksfile, output_cb) {
  rest.get(url).on('complete', function(res, resp){
    if (res instanceof Error) {
        console.error('Error: ' + response.message);
    } else {
      var $ = cheerio.load(res);
      output_cb(runChecks($, checksfile));
    }
  });
};

var writeOutput = function(output_json) {
  var outJson = JSON.stringify(output_json, null, 4);
  console.log(outJson);
};

if (require.main == module) {
  program
    .option('-c, --checks <val>', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
    .option('-f, --file <val>', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
    .option('-u, --url <val>', 'Url to index.html')
    .parse(process.argv);

  if (program.url) {
    checkUrl(program.url, program.checks, writeOutput);
  } else if (program.file) {
    checkHtmlFile(program.file, program.checks, writeOutput);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}

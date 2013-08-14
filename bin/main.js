#!/usr/local/bin/node

var logger = require('winston');
require('colors');
var argv = require('optimist')
    .usage('Usage: $0 -d [dir]')
    .demand(['d'])
    .argv;
var fs = require('graceful-fs');
var file = require('file');
var _ = require('underscore');
var path = require('path');

var dependencies = {};

// Should be relative to process.cwd()
var dir = argv.d;

var outstandingCounter = 0;

var files = file.walkSync(dir, function(fPath, dir, files){
  outstandingCounter++;
  _.each(files, function(file){
    fs.readFile(path.resolve(fPath+ "/" + file), "utf-8",  function(err, data){
      if (err){
        logger.error(err);
        return;
      }
      processFile(fPath, file, data);

    });
  });
});

function processFile(dir, file, data){
  dir = path.resolve(dir) + "/";
  var addr = path.resolve(dir, file);
  var match;
  var pattern = /((\w+)\s*=\s*)?require\s*\(\s*['"]([\.\/-\w]+)['"]\s*\)/g;

  // The list of variables to which a module is being assigned.
  var varNames = [];

  // The list of referenced modules
  var modules = [];

  // Build up varNames and reference list.
  while ( match = pattern.exec(data) ) {
    var varName = match[2];
    var module = match[3];
    
    if (/^\.?\.?\//.test(module)){
      //local, resolve.
      module = path.resolve(dir + module);
      module = module.replace(/\.js$/, "");
    }

    varNames.push(varName);
    modules.push(module);
  }

  dependencies[addr] = modules;

  outstandingCounter--;
  if (outstandingCounter == 0 ){
    processDependencies();
  }
  // TODO: See if we can find references to varNames to find 
  // unneeded module imports.
}

function processDependencies(){
  var toStringify = [];
  _.each(dependencies, function(dep, file){
    _.each(dep, function(module){
      toStringify.push({
        source: file,
        target: module
      });
    });
  });
  console.log(toStringify);
}

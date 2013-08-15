#!/usr/local/bin/node

var logger = require('winston');
require('colors');
var argv = require('optimist')
    .usage('Usage: $0 -d [dir] -o [JsonOutputFile] -h')
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

var processTimer;

function processFile(dir, file, data){
  dir = path.resolve(dir) + "/";
  var addr = path.resolve(dir, file);
  var match;
  var pattern = /((\w+)\s*=\s*)?require\s*\(\s*['"]([\.\/-\w]+)['"]\s*\)/g;

  // The list of variables to which a module is being assigned.
  var varNames = [];

  // The list of referenced modules
  var modules = [];
  var counter = 0;
  // Build up varNames and reference list.
  while ( match = pattern.exec(data) ) {
    var varName = match[2];
    var module = match[3];
    
    counter++;

    if (/^\.?\.?\//.test(module)){
      //local, resolve.
      module = path.resolve(dir + module);
      module = module.replace(/\.js$/, "");
    }

    // see if we can find a usage of the variable name

    // Don't want to count the initial definition as a usage, just replace
    data = data.replace(match[0], "");
    data.indexOf()



    modules.push({
      varUsed: (varName?false:null),
      module: module
    });
  }

  dependencies[addr] = modules;
  //TODO: obviously Should do a proper async callback on the file.walk()
  //  whenever that feature gets added to the library...
  if (processTimer){
    console.log("clearing");
    clearTimeout(processTimer);
  }
  
  // If no new files come in asynchronously in the next .25s, assume we're done 
  // and print the output. It's possible that this could execute multiple times.
  console.log("setting");
  processTimer = setTimeout(processDependencies, 250);
}

function processDependencies(){
  console.log("Processing!");
  var toStringify = [];
  _.each(dependencies, function(dep, file){
    _.each(dep, function(module){
      toStringify.push({
        source: file.replace(/\.js$/,""),
        target: module.module,
        type: module.varUsed
      });
    });
  });

  var toWrite = JSON.stringify(toStringify);
  if (argv.h){
    // Wrap in HTML
    var template = fs.readFileSync(__dirname + "/../__template.html", 'utf-8');
    template = template.replace("{{linkJSON}}", toWrite);
    toWrite = template;
  }

  if (argv.o){
    fs.writeFile(argv.o, toWrite, function(err){
      if (err) throw err;
      console.log("Output written.");
    });
  } else{
    console.log(toWrite);
  }
}

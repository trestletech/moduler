moduler
=======

A tool to visualize and report on dependencies in NodeJS projects.


Installation
------------

Pending. Will likely put on npm eventually. For now, you'll need to clone the repo then run `npm install`.

```
git clone https://github.com/trestletech/moduler.git
cd moduler
sudo npm install -g
```

Then the `moduler` command should be available system-wide.

Usage
-----

There current options include:

 - `-d <dir>` the directory containing the node files you want to process.
 - `-h` If not present, export the dependency graph as raw JSON. If present, export an HTML file wrapping that JSON which visualizes the graph using d3.
 - `-o <outputFile>` If present, will direct the output to the given file name.

 The following would generate an HTML file containing the d3 visualization of the dependency graph of the JavaScript files contained in the "lib" directory.

 ```
moduler -d ./lib/ -h -o "index.html"
 ```

Known Limitation
----------------

The recursive file reading function I'm using isn't able to callback when the recursive read of all the files in the given directory is done, so I'm using a hard-coded timer (currently set at 1 second) at which point the output is printed. This is longer than necessary for most projects, but could be shorter than necessary for others.

ToDo
----

 - Setup a proper callback on the file `walk` call.
 - Detect extraneous module imports by detecting when the variable to which an imported module is assigned is never again referenced in that file.
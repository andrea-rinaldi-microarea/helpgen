#!/usr/bin/env node

const error = require('./error');
const chalk = require('chalk');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const metadata = require('./metadata');
const createAppHelp = require('./application');

const assets = path.join(path.dirname(require.main.filename), 'assets');
console.log(assets);

console.log(chalk.bold('Welcome to the MagoCloud Help Pages generator'));

var workingPath = null;
const cmdArgs = process.argv.slice(2);

if (cmdArgs.length < 1) {
    error("Usage: helpgen <output> [input path]\nAt least the output path must be specified.");
}
var outputPath = cmdArgs[0];
if (!fs.existsSync(outputPath)) {
    error(`The output path ${outputPath} does not exists.`)
}

if (cmdArgs.length < 2) {
    workingPath = process.cwd();
} else {
    workingPath = cmdArgs[1];
}

var splittedPath = (workingPath).toLowerCase().split("\\").filter((element) => element !== "")
var applicationsDir = splittedPath[splittedPath.length - 1]
var standardDir = splittedPath[splittedPath.length - 2]

if(standardDir != "standard" || applicationsDir != "applications")
   error("Usage: helpgen <output> [input path]\n'input path' argument or current folder must be inside the 'Standard' folder of a TaskBuilder Application\ne.g.: <your instance>\\Standard\\Applications\\<your app>");

process.chdir(workingPath);
var appNames = metadata.scanFor('Application.config');
console.log(appNames);
 
apps = [];
appNames.forEach(appName => {
    app = {name: appName};
    if (createAppHelp(app, workingPath, outputPath)) {
        apps.push(app);
    }
});

copyAsset('Tables.sam', assets, outputPath, function(content) {
    apps.forEach(app => {
        content += `[INCLUDE Tables-${app.name}/${app.name}.sam]\n` 
    });
    return content;
});

console.log('end');

//=============================================================================

function copyAsset(assetName, source, destination, process = null) {
    try {
        if (process == null) {
            fs.copyFileSync(path.join(source,assetName), path.join(destination,assetName));
        } else {
            var content = fs.readFileSync(path.join(source,assetName), "utf8");
            var result = process(content);
            fs.writeFileSync(path.join(destination,assetName), result);
        }
    } catch (err) {
        error(err);
    }
}

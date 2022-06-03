#!/usr/bin/env node

const error = require('./error');
const chalk = require('chalk');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const metadata = require('./metadata');
const fsStuff = require('./fs-stuff'); 
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

var isStandard = _.toLower(workingPath).endsWith('\\standard\\applications');

if (!isStandard) {
    error("Usage: helpgen <output> [input path]\n'input path' argument or current folder must be inside the 'Standard' folder of a TaskBuilder Application\ne.g.: <your instance>\\Standard\\Applications\\<your app>");
}

fsStuff.rimraf(outputPath, false);

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

copyAsset('MagoCloudStructure.prjsam', assets, outputPath, function(content) {
    apps.forEach(app => {
        content += `project=${app.name}\\${app.name}.sam\n` 
    });
    return content;
});
copyAsset('DatabaseRefGuide.sam', assets, outputPath);

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

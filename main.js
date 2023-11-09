#!/usr/bin/env node
const notifications = require('./notifications');
const chalk = require('chalk');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const metadata = require('./metadata');
const createAppHelp = require('./application');

const assets = path.join(path.dirname(require.main.filename), 'assets');

console.log(chalk.cyan(chalk.bold('WELCOME TO THE MAGOCLOUD HELP PAGES GENERATOR!\n')));

var workingPath = null;
const cmdArgs = process.argv.slice(2);

if (cmdArgs.length < 1) {
    notifications.error("Usage: helpgen <output> [input path]\nAt least the output path must be specified.");
}
var outputPath = cmdArgs[0];
if (!fs.existsSync(outputPath)) {
    notifications.error(`The output path ${outputPath} does not exists.`)
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
   notifications.error("Usage: helpgen <output> [input path]\n'input path' argument or current folder must be inside the 'Standard' folder of a TaskBuilder Application\ne.g.: <your instance>\\Standard\\Applications\\<your app>");

process.chdir(workingPath);
var appNames = metadata.scanFor('Application.config');
console.log(chalk.bold('APPLICATIONS :'));
console.log(appNames);

console.log(chalk.bold(chalk.cyan('\n...GENERATION STARTED...\n')));

console.log(chalk.bold(chalk.cyan('\n...CHECK FOR ENUMERATIONS...\n')));

var enumsFileLs = searchRecursiveFileByName(workingPath, 'Enums.xml');

metadata.currentApplicationEnumLs = []

for(let i = 0; i < enumsFileLs.length; i ++) {
    var splittedPath = enumsFileLs[i].split("\\");
    var xmlContent = metadata.parseXML(enumsFileLs[i]);

    if(xmlContent.tag != undefined) {
        if(!metadata.isArray(xmlContent)) {
            var tmpContent = JSON.parse(JSON.stringify(xmlContent)).tag
            xmlContent = { tag : [] };
            xmlContent.tag.push(tmpContent) 
        }

        var appName = splittedPath[splittedPath.findIndex((element) => element == 'Applications') + 1]
        var moduleName = splittedPath[splittedPath.findIndex((element) => element == 'Applications') + 2];
            
        for(let i = 0;i < xmlContent.tag.length; i ++ ){
            metadata.currentApplicationEnumLs.push({
                name : xmlContent.tag[i].name,
                nameSpace : appName + "." + moduleName + "." + xmlContent.tag[i].name.replaceAll(" ","_")
            })
        }
    }
}

console.log(chalk.bold(chalk.cyan('\n...ENUMERATIONS ELABORATED SUCCESSFULLY...\n')));
 
apps = [];
appNames.forEach(appName => {
    app = {name: appName};
    if (createAppHelp(app, workingPath, outputPath)) {
        apps.push(app);
    }
});

console.log(chalk.bold(chalk.cyan('\n...APPLICATION GENERATION STARTED...\n')));

copyAsset('Applications.sam', assets, outputPath, function(content) {
    apps.forEach(app => {
        content += `[INCLUDE ${app.name}/${app.name}_modules.sam]\n` 
    });
    return content;
});

console.log(chalk.bold(chalk.cyan('\n...COPYING MAGO STYLE FILES...\n')));

fs.cp(path.join(path.dirname(require.main.filename), '_mago_styles'), path.join(outputPath,'_mago_styles'), { recursive: true }, (err) => {
    if (err) {
      console.error(err);
    }
  });

console.log(chalk.bold(chalk.cyan('\n...GENERATION COMPLETED!')));

//=============================================================================
function searchRecursiveFileByName (dir, pattern) {
    var results = [];
  
    fs.readdirSync(dir).forEach(function (dirInner){
      dirInner = path.resolve(dir, dirInner);
  
      var stat = fs.statSync(dirInner);
  
      if (stat.isDirectory()) {
        results = results.concat(searchRecursiveFileByName(dirInner, pattern));
      }
  
      if (stat.isFile() && dirInner.endsWith(pattern)) {
        results.push(dirInner);
      }
    });  

    return results;
};

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
        notifications.error(err);
    }
}

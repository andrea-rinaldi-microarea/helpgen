const metadata = require('./metadata');
const createModuleHelp = require('./module');
const path = require('path');
const error = require('./error');
const fs = require('fs');
const _ = require('lodash');
const markdown = require('./markdown');

module.exports = function createApplicationHelp(app, workingPath, outputPath) {
    process.chdir(path.join(workingPath, app.name));
    _.assignIn(app, metadata.parseXML('Application.config'));
    var moduleNames = metadata.scanFor('Module.config');
    app.modules = [];
    fs.mkdirSync(path.join(outputPath, app.name));
    moduleNames.forEach(moduleName => {
        mod = { name: moduleName };
        if (createModuleHelp(mod, path.join(workingPath, app.name), path.join(outputPath, app.name))) {
            app.modules.push(mod);
        }
    });
    if (!metadata.defined(app.localize)) {
        app.localize = `${app.name} Application`;
    }
    if (app.modules.length > 0) {
        console.log(`${app.name}:`);
        createHelpFile(outputPath, app);
        console.log(moduleNames);
        return true;
    }
    return false;
}


//-----------------------------------------------------------------------------
function createHelpFile(outputPath, app) {
    var content = `[H1]${app.localize}\nHere the **${app.localize}** modules:\n\n`;

    var gridContent = [["Module name / folder", "Description"]];
    app.modules.forEach(module => {
        gridContent.push([`[LINK ${module.name} ${module.name}]`, markdown.adjust(module.localize)]);
    });
    content += markdown.gridRender(gridContent);

    app.modules.forEach(module => {
        content += `[INCLUDE ${module.name}.sam]\n`;
    });
    
    try {
        fs.writeFileSync(path.join(outputPath, app.name, `${app.name}.sam`), content);
    } catch (err) {
        error(err);
    }
}


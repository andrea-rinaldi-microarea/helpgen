const metadata = require('./metadata');
const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const markdown = require('./markdown');
const error = require('./error');
const chalk = require('chalk');

module.exports = function createModuleHelp(module, workingPath, outputPath) {
    process.chdir(path.join(workingPath, module.name));
    _.assignIn(module, metadata.parseXML('Module.config'));
    if (!metadata.defined(module.localize)) {
        module.localize = "missing module description";
    }
    var dbMetadata = path.join('EFCore', 'EFSchemaObjects.xml');
    if (!fs.existsSync(dbMetadata)) {
        return false;
    }
    module.dbObjects = metadata.parseXML(dbMetadata);

    if (metadata.isArray(module.dbObjects.tables)) {
        mergeDBInfoData(module.dbObjects);
        createHelpFile(outputPath, module);
        return true;
    }
    return false;
}

//-----------------------------------------------------------------------------
function createHelpFile(outputPath, module) {
    var content = `[H2 ${module.appName}-${module.name}]${module.localize}\nHere the **${module.localize}** tables:\n\n`;

    var gridContent = [["Table name", "Description"]];
    module.dbObjects.tables.table.forEach(table => {
        if (!metadata.defined(table.localize)) table.localize = "";
        gridContent.push(
                            [`[LINK ${metadata.dashed(metadata.compact(table.namespace))} ${metadata.objectName(table.namespace)}]`, 
                            markdown.adjust(table.localize)]
                        );
    });
    content += markdown.gridRender(gridContent,{ forceTableNewLines : true });

    module.dbObjects.tables.table.forEach(table => {
        content += createTableDescription(table);
    });
    try {
        fs.writeFileSync(path.join(outputPath, `${module.name}_tables.sam`), content);
    } catch (err) {
        error(err);
    }
}

//-----------------------------------------------------------------------------
function createTableDescription(table) {
    var content = `[H3 ${metadata.dashed(metadata.compact(table.namespace))}]${metadata.objectName(table.namespace)}\n`;

    content += "[H4] Base Info\n";

    var gridContent = [
        ["Phisical Name",           metadata.objectName(table.namespace)],
        ["Content",                 markdown.adjust(table.localize)],
        ["Part of the document",    partOfDocument(table.document, metadata.appName(table.namespace))]
    ];
    if (metadata.defined(table.reference) && table.reference != '') {
        gridContent.push(
            ["References",          `[LINK ${metadata.dashed(metadata.compact(table.reference))} ${table.namespace}]`]
        );
    }
    content += markdown.gridRender(gridContent, { allLines: true });

    content += "[H4] Overview\n";

    if (!metadata.defined(table.documentationinfo)) {
        table.documentationinfo = { content : "", mandatory : false, readonly : false };
    } else {
        if(!metadata.defined(table.documentationinfo.content) )
           table.documentationinfo.content = "";
        if(!metadata.defined(table.documentationinfo.mandatory) )
           table.documentationinfo.mandatory = false;
        if(!metadata.defined(table.documentationinfo.readonly) )
           table.documentationinfo.readonly = false;
    }

    content += `${markdown.adjust(table.documentationinfo.content)}\n`;

    content += "[H4] Fields\n";
    if (metadata.isArray(table.columns)) {
        gridContent = [["Name", "Type & Len", "M", "R/O", "D", "Description"]];
        table.columns.column.forEach(column => {
            if (!metadata.defined(column.documentationinfo)) {
                column.documentationinfo = { content : "", mandatory : false, readonly : false };
            } else {
                if(!metadata.defined(column.documentationinfo.content) )
                   column.documentationinfo.content = "";
                if(!metadata.defined(column.documentationinfo.mandatory) )
                   column.documentationinfo.mandatory = false;
                if(!metadata.defined(column.documentationinfo.readonly) )
                   column.documentationinfo.readonly = false;
            }

            gridContent.push([
                hotlink(column, metadata.appName(table.namespace)), 
                columnType(column), 
                markdown.asCheck(column.documentationinfo.mandatory), 
                markdown.asCheck(column.documentationinfo.readonly), 
                defaultValue(column), 
                markdown.adjust(column.documentationinfo.content) 
            ])
        });
        content += markdown.gridRender(gridContent, { allLines: true });
    } else {
        content += "N/A\n";
        console.log(`${table.namespace} has no column defined`);
    }

    return content;
}

//-----------------------------------------------------------------------------
function mergeDBInfoData(dbObjects) {
    dbObjects.tables.table.forEach(table => {
        var dbinfoFName = path.join("ModuleObjects", "DBInfo",  `${metadata.objectName(table.namespace)}.xml`);
        if (!fs.existsSync(dbinfoFName)) {
            return;
        }
        dbInfoData = metadata.parseXML(dbinfoFName);
        if (metadata.defined(dbInfoData.localize)) table.localize = dbInfoData.localize;
        if (metadata.defined(dbInfoData.reference)) table.reference = dbInfoData.reference;
        if (metadata.defined(dbInfoData.document)) table.document = dbInfoData.document;

        if (metadata.isArray(table.columns)) {
            table.columns.column.forEach(column => {
                var colInfo = lookup(column.schemainfo.content, dbInfoData);
                if (metadata.defined(colInfo.reference) && colInfo.reference != "") 
                    column.reference = colInfo.reference;
            });
        }
    });
}

//-----------------------------------------------------------------------------
function partOfDocument(documentList, appName) {
    if (!metadata.defined(documentList) || documentList == "") {
        return "N/A";
    }
    var documents = documentList.split(",");
    var output="";
    documents.forEach(document => {
        if (document.includes('/')) {
            output += `${appName}.${document.split('/')[0]}.${document.split('/')[1]}[BR]`;
        } else {
            output += `${metadata.compact(document)}[BR]`;
        }
    });

    return output;
}

//-----------------------------------------------------------------------------
function columnType(column) {
    if (column.schemainfo.type == "String") {
        return `String ${column.schemainfo.length}`;
    } else if (column.schemainfo.type == "Enum") {
        return column.schemainfo.enumname;
    }
    return column.schemainfo.type;
}

//-----------------------------------------------------------------------------
function defaultValue(column) {
    if (column.schemainfo.type == "Date" || column.schemainfo.type == "DateTime" ) {
        if (column.schemainfo.defaultvalue == "1799-12-31T00:00:00") return "empty";
    }
    return column.schemainfo.defaultvalue;
}

//-----------------------------------------------------------------------------
function lookup(columnName, dbInfo) {
    if (!metadata.isArray(dbInfo.fields)) return {};
    var colInfo = {};
    dbInfo.fields.column.every(column => {
        if (column.name == columnName) {
            colInfo = column;
            return false;
        }
        return true;
    });

    return colInfo;
}

//-----------------------------------------------------------------------------
function hotlink(column, appName) {
    if (metadata.defined(column.reference)) {
        if (column.reference.includes('/')) {
            return `[LINK ${appName}-${column.reference.split('/')[0]}-${column.reference.split('/')[1]} ${column.schemainfo.content}]`;
        }
        return `[LINK ${metadata.dashed(metadata.compact(column.reference))} ${column.schemainfo.content}]`;
    }
    return column.schemainfo.content;
}
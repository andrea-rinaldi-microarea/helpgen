const _ = require('lodash');
const metadata = require('./metadata');

module.exports =  {

    //-----------------------------------------------------------------------------
    gridRender(gridContent, options = {}) {
        var colSpan = [];
        var render = "";
        gridContent.forEach(row => {
            row.forEach((col, idx)=> {
                if (!metadata.defined(col)) col = "";
                if (colSpan.length < idx + 1) {
                    colSpan.push(col.length);
                } else {
                    colSpan[idx] = Math.max(colSpan[idx], col.length);
                }
            });
        });
        render += gridLine(colSpan);
        gridContent.forEach((row, rIdx) => {
            row.forEach((col, cIdx) => {
                render += `|${_.padEnd(col,colSpan[cIdx])}`;
            });
            render +='|\n';
            if (options.allLines || rIdx == 0) {
                render += gridLine(colSpan);
            }
        });
        if (!options.allLines) {
            render += gridLine(colSpan);
        }
        return render;
    },

    //-----------------------------------------------------------------------------
    adjust(content) {
        if (!metadata.defined(content)) return "";
        return content.replace(/\<br\>/gi,"[BR]").replace(/(\r\n|\n|\r)/gm,"[BR]");
    },

    //-----------------------------------------------------------------------------
    asCheck(flag) {
        return flag ? "X" :"";
    }

}

//-----------------------------------------------------------------------------
function gridLine(colSpan) {
    var line = "";
    colSpan.forEach(span => {
        line += '+' +  _.repeat('-', span);
    });
    return line + '+\n';
}
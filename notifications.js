const chalk = require('chalk');

//=============================================================================
function error(msg) {
    console.log(chalk.bold(chalk.red('ERROR!')) + ' ' + chalk.red(msg));
    process.exit(1);
}

//=============================================================================
function warning(msg) {
    console.log(chalk.bold(chalk.yellow('WARNING!')) + ' ' + chalk.yellow(msg));
}

module.exports = {
    error,
    warning
};
const chalk = require('chalk');

module.exports = function error(msg) {
    console.log(chalk.red('ERROR!') + ' ' + chalk.red(msg));
    process.exit(1);
}
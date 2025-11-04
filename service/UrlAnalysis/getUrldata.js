import chalk from 'chalk';
import { terminal } from '../../terminal.js';
import ora from 'ora';
export const whatWeb = async (url) => {
    const spinner = ora('Running whatweb...').start();
    const response = await terminal(`whatweb ${url} --color=never`);
    spinner.succeed(chalk.green('Whatweb completed'));
    return response;
}
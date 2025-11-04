import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { identifyAndValidatingInput } from '../Helper/inputHelper.js';
import { whatWeb } from '../service/UrlAnalysis/getUrldata.js';
import { analysisTestRsultAndRetuningInterestedValuesAsJson } from '../service/Ai/main.js';
export const getTarget = async () => {
    
    const target = await inquirer.prompt({
        type: 'input',
        name: 'target',
        message: 'Enter the target IP or domain',
    });
    const validatedTarget = await identifyAndValidatingInput(target.target);
    if(!validatedTarget) {
        console.log(chalk.red('Invalid target'));
        return null;
    }else if (validatedTarget.type === 'url') {
        const whatWebResult = await whatWeb(validatedTarget.value);
         const spinner = ora('Analyzing whatweb result...').start();
        const interestingValues = await analysisTestRsultAndRetuningInterestedValuesAsJson({ testResult: whatWebResult });
        spinner.succeed(chalk.green('Analysis completed'));
        console.log(chalk.green(interestingValues));
        return interestingValues;
    }else if (validatedTarget.type === 'ip') {
        console.log(chalk.green('Validating IP...'));
        return validatedTarget.value;
    }
    return target;
}
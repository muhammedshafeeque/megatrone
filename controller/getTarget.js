import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { identifyAndValidatingInput } from '../Helper/inputHelper.js';
export const getTarget = async () => {
    
    const target = await inquirer.prompt({
        type: 'input',
        name: 'target',
        message: 'Enter the target IP or domain',
    });
    const validatedTarget = await identifyAndValidatingInput(target.target);
    console.log(validatedTarget);
    return target.target;
}
import chalk from 'chalk';
import { getTarget } from './controller/getTarget.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import { aiChat } from './service/Ai/main.js';
import ora from 'ora';
dotenv.config();
const main = async () => {
    console.log('\n');
    console.log(chalk.blue('┌' + '─'.repeat(58) + '┐'));
    console.log(chalk.blue('│') + chalk.bold.cyan('  🔧 Transformer • Cyber Ops Toolkit') + ' '.repeat(58 - '  🔧 Transformer • Cyber Ops Toolkit'.length) + chalk.blue('│'));
    console.log(chalk.blue('│') + '  ' + chalk.gray('Initialize • Connectivity • AI • DB • Terminal') + ' '.repeat(58 - 2 - 'Initialize • Connectivity • AI • DB • Terminal'.length) + chalk.blue('│'));
    console.log(chalk.blue('│') + '  ' + chalk.gray('Status: ') + chalk.yellow('booting...') + ' '.repeat(58 - 2 - ('Status: '.length + 'booting...'.length)) + chalk.blue('│'));
    console.log(chalk.blue('└' + '─'.repeat(58) + '┘'));
    console.log('\n');
    try {
 
        if (!process.env.MISTRAL_API_KEY) {
            console.warn(chalk.yellow('Warning: MISTRAL_API_KEY not set. AI features will be disabled.'));
        } else {
            console.log(chalk.green('Mistral key: OK'));
        }
        await connectDB();
        console.log(chalk.green('ArangoDB: connected'));
    } catch (err) {
        console.error(chalk.red(`Connectivity check failed: ${err.message}`));
        process.exit(1);
    }
    if (process.env.MISTRAL_API_KEY) {
        try {
            const spinner = ora('Pinging AI...').start();
            const reply = await aiChat('Hello');
            spinner.succeed(chalk.green('AI ping successful you can start now '));
        } catch (e) {
            spinner.fail(chalk.red('AI ping failed'));
            console.error(chalk.red(`AI ping failed: ${e.message}`));
            process.exit(1);
        }
    }
    const target = await getTarget();
    

}

main();
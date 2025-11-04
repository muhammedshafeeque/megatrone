import chalk from 'chalk';
import { getTarget } from './controller/getTarget.js';
import { terminal } from './terminal.js';
const main = async () => {
    console.log('Starting CyberTruck');
    const target = await getTarget();
    

}

main();
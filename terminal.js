import { spawn } from 'child_process';
import chalk from 'chalk';

export const terminal = async (command) => {
    return new Promise((resolve, reject) => {
        // Spawn the process with shell: true to handle complex commands
        // When using shell: true, pass command as first arg and empty array as second
        const childProcess = spawn(command, [], {
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        // Stream stdout in real-time
        childProcess.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            // Print live output
            process.stdout.write(chalk.cyan(output));
        });

        // Stream stderr in real-time
        childProcess.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            // Print live error output
            process.stderr.write(chalk.red(output));
        });

        // Handle process completion
        childProcess.on('close', (code) => {
            const logs = {
                stdout: stdout,
                stderr: stderr,
                exitCode: code,
                command: command
            };

            if (code !== 0) {
                reject({
                    ...logs,
                    error: `Command exited with code ${code}`
                });
            } else {
                resolve(logs);
            }
        });

        // Handle process errors
        childProcess.on('error', (error) => {
            reject({
                stdout: stdout,
                stderr: stderr,
                error: error.message,
                command: command
            });
        });
    });
};
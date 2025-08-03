#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { createInstance } from './deploy';
import { install } from './install';
import { createEnvFileContent } from './utils';

/**
 * This is the main entry point for the command-line tool.
 * It uses yargs to parse command-line arguments and execute the appropriate function.
 */
yargs(hideBin(process.argv))
  // --- DEPLOY COMMAND ---
  .command(
    'deploy',
    chalk.green('Deploy a new Vultr server instance based on your .env configuration.'),
    () => {}, // No additional options for this command
    async () => {
      try {
        console.log(chalk.bold.magenta('--- Starting Deployment Process ---'));
        const instance = await createInstance();

        // After instance is created, generate and write the .server.env file
        const envContent = await createEnvFileContent(instance);
        const envPath = path.resolve(process.cwd(), '.server.env');
        await fs.writeFile(envPath, envContent);

        console.log(chalk.cyan.bold(`\n✔ Server environment file created at: ${envPath}`));
        console.log(chalk.cyan('  You can now run the "install" command.'));

        console.log(chalk.bold.magenta('\n--- Deployment Process Finished ---'));
      } catch (error) {
        console.error(error);
        // The error is already logged in createInstance, so we just ensure the process exits.
        process.exit(1);
      }
    }
  )
  // --- INSTALL COMMAND ---
  .command(
    'install',
    chalk.blue('Run the installation and hardening scripts on the server defined in .server.env.'),
    () => {}, // No additional options for this command
    async () => {
      try {
        console.log(chalk.bold.cyan('--- Starting Installation Process ---'));
        await install();
        console.log(chalk.bold.cyan('\n--- Installation Process Finished ---'));
      } catch (error) {
        console.error(error);
        // The error is already logged in install, so we just ensure the process exits.
        process.exit(1);
      }
    }
  )
  .demandCommand(1, chalk.red('You must provide a valid command: deploy or install.'))
  .help()
  .alias('h', 'help')
  .strict()
  .parse();

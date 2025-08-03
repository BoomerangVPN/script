import axios from 'axios';
import chalk from 'chalk';
import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import type { VultrInstance } from '../types/vultr';
import { config } from './config';

/**
 * A simple sleep utility to pause execution.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>}
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Polls the Vultr API for a given instance until it is active and has a valid IP.
 * @param {string} instanceId - The ID of the instance to check.
 * @returns {Promise<VultrInstance>} The full instance object once it's ready.
 */
export const waitForInstanceReady = async (instanceId: string): Promise<VultrInstance> => {
  const POLLING_INTERVAL = 10000; // 10 seconds
  const MAX_ATTEMPTS = 30; // 5 minutes max
  let attempts = 0;

  console.log(chalk.yellow('\n> Waiting for instance to become active and get an IP...'));

  while (attempts < MAX_ATTEMPTS) {
    try {
      const response = await axios.get<{ instance: VultrInstance }>(`${config.vultr.baseUrl}/instances/${instanceId}`, {
        headers: { Authorization: `Bearer ${config.vultr.apiKey}` },
      });
      const instance = response.data.instance;

      // Check if the instance is active and has a real IP address
      if (instance.status === 'active' && instance.main_ip !== '0.0.0.0') {
        console.log(chalk.green('✔ Instance is active!'));
        return instance;
      }

      process.stdout.write(
        chalk.yellow(
          `  Status: ${instance.status}, IP: ${instance.main_ip}. Retrying in ${POLLING_INTERVAL / 1000}s...\r`
        )
      );
      attempts++;
      await sleep(POLLING_INTERVAL);
    } catch (error) {
      // Handle transient errors during polling
      console.error(chalk.red(`\nError while polling for instance status: ${error}`));
      throw new Error('Failed to get instance status.');
    }
  }

  throw new Error('Instance did not become active in the allotted time.');
};

/**
 * Generates the content for the .server.env file by reading a template
 * and replacing placeholders with instance-specific values.
 * @param {VultrInstance} instance - The newly created Vultr instance.
 * @returns {Promise<string>} The formatted string content for the .env file.
 */
export const createEnvFileContent = async (instance: VultrInstance): Promise<string> => {
  const templatePath = path.resolve(process.cwd(), '.server.env.template');
  let templateContent: string;
  try {
    templateContent = await fs.readFile(templatePath, 'utf-8');
  } catch (error) {
    console.error(chalk.red(`Error: Could not read template file at ${templatePath}`), error);
    throw new Error('Template file .server.env.template not found or unreadable.');
  }

  const newUserPassword = randomBytes(16).toString('hex');

  // Replace placeholders from the template file
  const content = templateContent
    .replace('%IP%', instance.main_ip)
    .replace(/%ROOT_PASSWORD%/g, instance.default_password || '')
    .replace(/%NEW_USER_PASSWORD%/g, newUserPassword);

  return content;
};

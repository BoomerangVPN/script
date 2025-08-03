import axios, { AxiosError } from 'axios';
import boxen from 'boxen';
import chalk from 'chalk';

import type { VultrInstance, VultrOS, VultrPlan, VultrRegion } from '../types/vultr';
import { config } from './config';
import { waitForInstanceReady } from './utils';

/**
 * Finds the specified region details from the Vultr API.
 * @param {string} regionCity - The city name of the desired region (e.g., "Singapore").
 * @returns {Promise<VultrRegion>} The full region object from the API.
 */
const getRegion = async (regionCity: string): Promise<VultrRegion> => {
  console.log(chalk.blue(`> Searching for region: ${regionCity}...`));
  const response = await axios.get(`${config.vultr.baseUrl}/regions`, {
    headers: { Authorization: `Bearer ${config.vultr.apiKey}` },
  });

  const region = response.data.regions.find((r: VultrRegion) => r.city.toLowerCase() === regionCity.toLowerCase());

  if (!region) {
    throw new Error(`Region "${regionCity}" not found. Please check the city name.`);
  }
  console.log(chalk.green(`  Found region: ${region.id}`));
  return region;
};

/**
 * Finds the specified operating system details from the Vultr API.
 * @param {string} osName - A search term for the OS name (e.g., "Ubuntu 20.04").
 * @returns {Promise<VultrOS>} The full OS object from the API.
 */
const getOS = async (osName: string): Promise<VultrOS> => {
  console.log(chalk.blue(`> Searching for OS: ${osName}...`));
  const response = await axios.get(`${config.vultr.baseUrl}/os`, {
    headers: { Authorization: `Bearer ${config.vultr.apiKey}` },
  });

  const os = response.data.os.find(
    (o: VultrOS) => o.name.toLowerCase().includes(osName.toLowerCase()) && o.arch === 'x64'
  );

  if (!os) {
    throw new Error(`OS matching "${osName}" not found or not available in x64 architecture.`);
  }
  console.log(chalk.green(`  Found OS: ${os.name} (ID: ${os.id})`));
  return os;
};

/**
 * Finds the specified instance plan details for a given region.
 * @param {string} planId - The ID of the desired plan (e.g., "vc2-1c-1gb").
 * @param {VultrRegion} region - The region where the plan should be available.
 * @returns {Promise<VultrPlan>} The full plan object from the API.
 */
const getPlan = async (planId: string, region: VultrRegion): Promise<VultrPlan> => {
  console.log(chalk.blue(`> Searching for plan: ${planId} in ${region.city}...`));
  const response = await axios.get(`${config.vultr.baseUrl}/plans`, {
    headers: { Authorization: `Bearer ${config.vultr.apiKey}` },
    params: { type: 'vc2', region: region.id },
  });

  const plan = response.data.plans.find((p: VultrPlan) => p.id === planId);

  if (!plan) {
    throw new Error(`Plan "${planId}" not found or not available in the ${region.city} region.`);
  }
  console.log(chalk.green(`  Found plan: ${plan.id} ($${plan.monthly_cost}/mo)`));
  return plan;
};

/**
 * Main function to create the Vultr instance.
 * It fetches the necessary IDs and sends the creation request.
 * @returns {Promise<VultrInstance>} The final, active instance object.
 */
const createInstance = async (): Promise<VultrInstance> => {
  try {
    const region = await getRegion(config.vultr.region);
    const os = await getOS(config.vultr.os);
    const plan = await getPlan(config.vultr.plan, region);

    console.log(
      boxen(
        chalk.white(
          `OS: ${chalk.green(os.name)}\n` + `Plan: ${chalk.green(plan.id)}\n` + `Region: ${chalk.green(region.city)}`
        ),
        {
          padding: 1,
          margin: 1,
          borderColor: 'cyan',
          title: 'Deploying New Server',
          titleAlignment: 'center',
        }
      )
    );

    const initialResponse = await axios.post<{ instance: VultrInstance }>(
      `${config.vultr.baseUrl}/instances`,
      {
        label: config.vultr.label,
        region: region.id,
        plan: plan.id,
        os_id: os.id,
      },
      {
        headers: {
          Authorization: `Bearer ${config.vultr.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let instance = initialResponse.data.instance;
    console.log(chalk.green.bold('\n🚀 Instance creation initiated successfully!'));

    instance = await waitForInstanceReady(instance.id);

    console.log(chalk.green.bold('\nInstance Details:'));
    console.log(`> ID: ${instance.id}`);
    console.log(`> IP Address: ${chalk.bold.cyan(instance.main_ip)}`);
    if (instance.default_password) {
      console.log(chalk.red.bold(`> Temporary Root Password: ${instance.default_password}`));
    }
    console.log(`> Status: ${instance.status}`);

    return instance;
  } catch (error) {
    console.error(chalk.red.bold('\n❌ An error occurred during deployment.'));
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error: string }>;
      const errorMessage = axiosError.response?.data?.error || axiosError.message;
      console.error(chalk.red(`Vultr API Error: ${errorMessage}`));
    } else if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unknown error occurred.'), error);
    }
    process.exit(1);
  }
};

// --- Exports ---
export { createInstance, getOS, getPlan, getRegion };

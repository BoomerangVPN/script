import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Reads a .env file from the given path, parses it, and returns the configuration object.
 * @param {string} filePath - The absolute path to the .env file.
 * @returns {dotenv.DotenvParseOutput} The parsed environment variables.
 */
function loadEnvFile(filePath: string): dotenv.DotenvParseOutput {
  try {
    const fileContent = fs.readFileSync(filePath);
    return dotenv.parse(fileContent);
  } catch (error) {
    console.error(`Error: Could not read or parse the environment file at ${filePath}.`);
    console.error('Please ensure the file exists and is correctly formatted.');
    console.error(error);
    // In a real application, you might want to handle this more gracefully.
    // For this script, we'll exit if a config file is missing.
    process.exit(1);
  }
}

// --- General Project Configuration (.env) ---
// This configuration is for the Vultr API to create and manage servers.
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = loadEnvFile(envPath);

export const config = {
  vultr: {
    apiKey: envConfig.VULTR_API_KEY,
    region: envConfig.VULTR_REGION,
    plan: envConfig.VULTR_PLAN,
    os: envConfig.VULTR_OS,
    label: envConfig.VULTR_INSTANCE_LABEL,
    baseUrl: 'https://api.vultr.com/v2',
  },
  // Configuration for the installation scripts
  install: {
    scriptFiles: ['common.sh', 'harden.sh', 'setup.sh', 'wireguard.sh'],
    localScriptDir: 'scripts',
    remoteTempDir: '/tmp/setup-scripts',
  },
};

// --- Server Setup Configuration (.server.env) ---
// This configuration is for connecting to and setting up the provisioned server.
const serverEnvPath = path.resolve(process.cwd(), '.server.env');
const serverEnvConfig = loadEnvFile(serverEnvPath);

export const serverConfig = {
  host: serverEnvConfig.HOST,
  username: serverEnvConfig.USERNAME,
  password: serverEnvConfig.PASSWORD,
  newUser: {
    sshPort: serverEnvConfig.NEW_USER_SSH_PORT,
    name: serverEnvConfig.NEW_USER_NAME,
    password: serverEnvConfig.NEW_USER_PASSWORD,
  },
  alerts: {
    email: serverEnvConfig.ALERT_EMAIL,
  },
  clientName: serverEnvConfig.CLIENT_NAME,
  serverName: serverEnvConfig.SERVER_NAME,
};

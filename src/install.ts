import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { Client, ConnectConfig } from 'ssh2';
import SftpClient from 'ssh2-sftp-client';

import { config, serverConfig } from './config'; // Import both configs

// --- Generic Remote Execution Functions ---

/**
 * Interface for specifying a file to upload.
 */
interface FileUpload {
  localPath: string;
  remotePath: string;
}

/**
 * Uploads an array of files to a remote server using SFTP.
 * @param sshConfig The SSH connection configuration.
 * @param files An array of file objects to upload.
 * @param destinationDir The remote directory where files will be uploaded.
 */
async function upload(sshConfig: ConnectConfig, files: FileUpload[], destinationDir: string): Promise<void> {
  const sftp = new SftpClient();
  try {
    console.log(chalk.blue(`\nConnecting to ${sshConfig.host} via SFTP...`));
    await sftp.connect(sshConfig);

    console.log(chalk.blue(`> Ensuring remote directory exists: ${destinationDir}`));
    await sftp.mkdir(destinationDir, true); // `true` makes it recursive (like mkdir -p)

    console.log(chalk.blue('> Uploading files...'));
    for (const file of files) {
      if (!fs.existsSync(file.localPath)) {
        throw new Error(`Local file not found: ${file.localPath}`);
      }
      const remoteFullPath = path.join(destinationDir, path.basename(file.remotePath));
      console.log(chalk.green(`  Uploading ${path.basename(file.localPath)} to ${remoteFullPath}`));
      await sftp.put(file.localPath, remoteFullPath);
    }
    console.log(chalk.green('✔ All files uploaded successfully.'));
  } finally {
    await sftp.end();
    console.log(chalk.gray('SFTP connection closed.'));
  }
}

/**
 * Downloads a single file from a remote server using SFTP.
 * @param sshConfig The SSH connection configuration.
 * @param remoteFilePath The full path of the file to download from the server.
 * @param localDestinationPath The local path where the file will be saved.
 */
async function download(sshConfig: ConnectConfig, remoteFilePath: string, localDestinationPath: string): Promise<void> {
  const sftp = new SftpClient();
  try {
    console.log(chalk.blue(`\nConnecting to ${sshConfig.host} via SFTP for download...`));
    await sftp.connect(sshConfig);

    console.log(chalk.blue(`> Preparing to download file: ${remoteFilePath}`));
    const localDir = path.dirname(localDestinationPath);
    // Ensure the local directory exists before downloading
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
      console.log(chalk.gray(`  Created local directory: ${localDir}`));
    }

    console.log(chalk.green(`  Downloading to ${localDestinationPath}`));
    await sftp.get(remoteFilePath, localDestinationPath);
    console.log(chalk.green('✔ File downloaded successfully.'));
  } finally {
    await sftp.end();
    console.log(chalk.gray('SFTP connection closed.'));
  }
}

/**
 * Executes a series of shell commands on a remote server via SSH.
 * @param sshConfig The SSH connection configuration.
 * @param commands An array of commands to execute in sequence.
 */
function run(sshConfig: ConnectConfig, commands: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    // Chain commands with '&&' to ensure they run sequentially and stop if one fails.
    const commandString = commands.join(' && ');

    conn
      .on('ready', () => {
        console.log(chalk.blue('\nSSH connection ready. Executing remote commands...'));
        console.log(chalk.yellow('\n--- Remote Script Output ---'));
        conn.exec(commandString, (err, stream) => {
          if (err) {
            return reject(err);
          }
          stream
            .on('close', (code: number | null) => {
              console.log(chalk.yellow('--- End of Remote Script Output ---'));
              if (code !== 0) {
                reject(new Error(`Remote script exited with non-zero code: ${code}`));
              } else {
                conn.end();
                resolve();
              }
            })
            .on('data', (data: Buffer) => process.stdout.write(data.toString()))
            .stderr.on('data', (data: Buffer) => process.stderr.write(data.toString()));
        });
      })
      .on('error', (err: Error) => reject(new Error(`SSH Connection Error: ${err.message}`)))
      .on('close', () => console.log(chalk.gray('SSH connection closed.')))
      .connect(sshConfig);
  });
}

/**
 * Orchestrates the entire server setup process.
 * It uploads necessary scripts and then executes them on the remote server.
 */
async function install(): Promise<void> {
  console.log(chalk.cyan.bold('--- Starting Server Setup & Hardening ---'));
  console.log(chalk.cyan(`> Target Host: ${serverConfig.host}`));

  const sshConfig: ConnectConfig = {
    host: serverConfig.host,
    port: 22, // Initial connection is always on port 22 with the root user
    username: serverConfig.username,
    password: serverConfig.password,
  };

  try {
    // 1. Prepare file list
    const filesToUpload: FileUpload[] = config.install.scriptFiles.map(file => ({
      localPath: path.join(process.cwd(), config.install.localScriptDir, file),
      remotePath: file,
    }));

    // 2. Upload all scripts (setup.sh, wireguard.sh, harden.sh)
    console.log(chalk.magenta.bold('\n[Step 1/4] Uploading setup scripts...'));
    await upload(sshConfig, filesToUpload, config.install.remoteTempDir);

    // 3. Prepare and run the WireGuard setup
    console.log(chalk.magenta.bold('\n[Step 2/4] Executing WireGuard setup...'));
    const wireguardSetupCommand = `./setup.sh --ip "${serverConfig.host}" --client "${serverConfig.clientName}"`;
    const wireguardCommands = [`cd ${config.install.remoteTempDir}`, 'chmod +x *.sh', wireguardSetupCommand];
    await run(sshConfig, wireguardCommands);

    // 4. Download the generated client config file
    console.log(chalk.magenta.bold('\n[Step 3/4] Downloading generated client config...'));
    const remoteConfigPath = path.posix.join('/etc/wireguard', `${serverConfig.clientName}.conf`);
    const localConfigPath = path.join(process.cwd(), `${serverConfig.clientName}.conf`);
    await download(sshConfig, remoteConfigPath, localConfigPath);

    // 5. Prepare and run the server hardening script
    console.log(chalk.magenta.bold('\n[Step 4/4] Executing server hardening...'));
    const hardeningCommand = `./harden.sh \\
        --port ${serverConfig.newUser.sshPort} \\
        --username "${serverConfig.newUser.name}" \\
        --password "${serverConfig.newUser.password}" \\
        --email "${serverConfig.alerts.email}" \\
        --server-name "${serverConfig.serverName}"`;
    const hardeningCommands = [`cd ${config.install.remoteTempDir}`, hardeningCommand];
    await run(sshConfig, hardeningCommands);

    console.log(chalk.green.bold('\n✔✔✔ Full setup and hardening process completed successfully! ✔✔✔'));

    // WireGuard instructions
    console.log(chalk.cyan(`\nClient config file downloaded to: ${localConfigPath}`));
    console.log(chalk.cyan.bold('\n--- How to Use Your New VPN Config ---'));
    console.log(
      chalk.white('1. Go to https://www.wireguard.com/install/ and install the official app for your device.')
    );
    console.log(chalk.white('2. Open the WireGuard app and click "Add Tunnel" (or a "+" icon).'));
    console.log(chalk.white('3. Import the downloaded config file:'));
    console.log(chalk.gray(`     - On a computer, you can select the file directly: ${localConfigPath}`));
    console.log(chalk.gray('     - On a phone, the easiest way is to generate a QR code on your computer'));
    console.log(chalk.gray('       from the file and scan it with your phone WireGuard app.'));
    console.log(chalk.white('4. Give the connection a name and toggle the switch to activate the VPN.'));

    // SSH instructions
    console.log(chalk.yellow.bold('\nACTION REQUIRED: Your SSH credentials have changed.'));
    console.log(chalk.yellow('Please save the following new credentials immediately:'));
    console.log(chalk.white(`  Host:      ${serverConfig.host}`));
    console.log(chalk.white(`  Port:      ${serverConfig.newUser.sshPort}`));
    console.log(chalk.white(`  Username:  ${serverConfig.newUser.name}`));
    console.log(chalk.white(`  Password:  ${serverConfig.newUser.password}`));
    console.log(chalk.yellow('\nReconnect to your server using:'));
    console.log(
      chalk.white(`ssh ${serverConfig.newUser.name}@${serverConfig.host} -p ${serverConfig.newUser.sshPort}`)
    );
  } catch (error) {
    console.error(chalk.red.bold('\n❌ --- INSTALLATION FAILED --- ❌'));
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
      console.error(chalk.red('Please check the .server.env file and try again (maybe the server is not ready yet).'));
    } else {
      console.error(chalk.red('An unknown error occurred:'), error);
    }
    process.exit(1); // Exit with an error code
  }
}

// --- Exports ---
// Grouping all exports at the end for cleaner code.
export { install, run, upload };

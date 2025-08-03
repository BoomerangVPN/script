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

  // Resolve the private key path relative to the home directory if it starts with '~'
  const privateKeyPath = serverConfig.privateKeyPath.startsWith('~')
    ? path.join(process.env.HOME || '', serverConfig.privateKeyPath.slice(1))
    : serverConfig.privateKeyPath;

  const sshConfig: ConnectConfig = {
    host: serverConfig.host,
    port: 22, // Initial connection is always on port 22 with the root user
    username: serverConfig.username,
    privateKey: fs.readFileSync(path.resolve(privateKeyPath)),
  };

  try {
    // 1. Prepare the list of files to upload from the main config
    const filesToUpload: FileUpload[] = config.install.scriptFiles.map(file => ({
      localPath: path.join(process.cwd(), config.install.localScriptDir, file),
      remotePath: file,
    }));

    // 2. Upload the scripts
    console.log(chalk.magenta.bold('\n[Step 1/2] Uploading setup scripts...'));
    await upload(sshConfig, filesToUpload, config.install.remoteTempDir);

    // 3. Prepare the commands to execute remotely
    const setupCommand = `./setup.sh \\
        --port ${serverConfig.newUser.sshPort} \\
        --username "${serverConfig.newUser.name}" \\
        --password "${serverConfig.newUser.password}" \\
        --email "${serverConfig.alerts.email}" \\
        --server-name "${serverConfig.serverName}"`;

    const commandsToRun = [
      `cd ${config.install.remoteTempDir}`,
      'chmod +x *.sh', // Make all scripts executable
      setupCommand,
    ];

    // 4. Run the commands
    console.log(chalk.magenta.bold('\n[Step 2/2] Executing remote setup...'));
    await run(sshConfig, commandsToRun);

    console.log(chalk.green.bold('\n✔✔✔ Installation process completed successfully! ✔✔✔'));
  } catch (error) {
    console.error(chalk.red.bold('\n❌ --- INSTALLATION FAILED --- ❌'));
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unknown error occurred:'), error);
    }
    process.exit(1); // Exit with an error code
  }
}

// --- Exports ---
// Grouping all exports at the end for cleaner code.
export { install, run, upload };

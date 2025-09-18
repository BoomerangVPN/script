# Boomerang VPN boomerang

The 100% Private VPN. One user. One server. One IP. **No shared VPNs. No logs. No blocks.**

> This is a free script. We appreciate your support to help keep this project maintained for humanity's freedom.
>
> [![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-💛-ff5f5f)](https://www.buymeacoffee.com/boomerangvpn)
>
> Thank you for your support
> Boomerang VPN Team

Boomerang VPN is a powerful script that automates the deployment of your own personal, ultra-private VPN on a Virtual Private Server (VPS). It puts you in complete control, eliminating the risks and limitations of commercial shared VPN services.

## Why Boomerang VPN? ✨

With a traditional VPN, you're sharing an IP address with hundreds of other users, leading to blocks, slow speeds, and questionable privacy policies. Boomerang gives you a dedicated server that is yours and yours alone.

- **Dedicated IP Address**: Get a unique, clean IP address that belongs only to you.
- **Full Server Control**: You own the VPN server on your personal VPS.
- **Zero Logs, Ever**: Since you own the server, your activity is never logged or monitored.
- **No More IP Bans**: Access websites and services without being blocked due to others' actions.
- **Fast & Consistent Performance**: Enjoy your server's full bandwidth without sharing it.
- **True Privacy & Security**: Your traffic is completely isolated, and only you have access.
- **One-Click Setup**: The script fully automates the entire setup process.
- **Bypass Censorship**: Reliably bypass geo-blocking and internet restrictions.
- **You Control Your Data**: Manage your own data and DNS settings.
- **Transparent & Decentralized**: No central authority, no hidden policies. You see everything.

---

## Getting Started 🚀

Follow these steps to set up your personal VPN.

### 1. Prerequisite: Install Node.js

You'll need Node.js installed on your computer to run the script. Here are the simplest ways to install it for your operating system.

- **macOS 🍎** The easiest way is using [Homebrew](https://brew.sh/). Open your terminal and run:

  ```sh
  brew install node
  ```

- **Windows 🪟** Download and run the official LTS installer from the [Node.js website](https://nodejs.org/en/download).

- **Linux 🐧** The recommended method is using Node Version Manager (nvm) to avoid permission issues.

  ```sh
  # Install nvm
  curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash

  # You may need to restart your terminal after this

  # Install the latest LTS version of Node.js
  nvm install --lts
  ```

### 2. Get the Boomerang Script

Open your terminal, navigate to the directory where you want to store the project, and clone the repository.

```sh
git clone git@github.com:BoomerangVPN/script.git
cd script
```

### 3. Run the Commands

The script handles everything from server creation to client configuration.

- **See all available options:**

  ```sh
  npx ts-node src/run.ts help
  ```

- **Deploy your VPN server:** This command will provision and configure your new VPN server on a VPS provider.

  ```sh
  npx ts-node src/run.ts deploy
  ```

- **Install the VPN client configuration:** After deployment, this command sets up the VPN connection on your local machine.

  ```sh
  npx ts-node src/run.ts install
  ```

That's it! Your 100% private Boomerang VPN is now ready to use.

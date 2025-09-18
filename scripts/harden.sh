#!/bin/sh

# This script performs basic security hardening on a fresh Ubuntu server.
# It is designed to be run non-interactively.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Argument Parsing ---
while [ "$#" -gt 0 ]; do
    case "$1" in
        --port) NEW_SSH_PORT="$2"; shift 2;;
        --username) NEW_USER="$2"; shift 2;;
        --password) NEW_PASS="$2"; shift 2;;
        --email) ALERT_EMAIL="$2"; shift 2;;
        --server-name) SERVER_NAME="$2"; shift 2;;
        *) echo "Unknown parameter passed: $1"; exit 1;;
    esac
done

# --- Validate Arguments ---
if [ -z "$NEW_SSH_PORT" ] || [ -z "$NEW_USER" ] || [ -z "$NEW_PASS" ] || [ -z "$ALERT_EMAIL" ] || [ -z "$SERVER_NAME" ]; then
    echo "Error: --port, --username, --password, --email, and --server-name are all required." >&2
    exit 1
fi

echo "\n--- Starting Server Hardening ---"

# 1. Set Hostname
echo "\nStep 1/6: Setting server hostname to '$SERVER_NAME'..."
hostnamectl set-hostname "$SERVER_NAME"
# Update hosts file for local resolution
sed -i "s/127.0.1.1.*/127.0.1.1\t$SERVER_NAME/" /etc/hosts
echo "--> Hostname updated."

# 2. Create New Sudo User
echo "\nStep 2/6: Creating new sudo user '$NEW_USER'..."
useradd -m -s /bin/bash "$NEW_USER"
echo "$NEW_USER:$NEW_PASS" | chpasswd
usermod -aG sudo "$NEW_USER"
echo "--> User '$NEW_USER' created and added to sudo group."

# 3. Harden SSH Configuration
echo "\nStep 3/6: Hardening SSH configuration..."
# Change SSH Port
sed -i -e "s/^#?Port 22/Port $NEW_SSH_PORT/" /etc/ssh/sshd_config
# Disable root login
sed -i -e "s/^#?PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config
# Prioritize Public Key Authentication
sed -i -e "s/^#?PubkeyAuthentication.*/PubkeyAuthentication yes/" /etc/ssh/sshd_config
# Keep password authentication for the new user for now
sed -i -e "s/^#?PasswordAuthentication.*/PasswordAuthentication yes/" /etc/ssh/sshd_config
echo "--> SSH port changed to $NEW_SSH_PORT, root login disabled."

# 4. Update Firewall for New SSH Port
echo "\nStep 4/6: Updating firewall (UFW)..."
ufw allow "$NEW_SSH_PORT"/tcp
# Delete the old rule if it exists. The '|| true' prevents an error if the rule isn't found.
ufw delete allow 22/tcp || true
echo "--> Firewall updated to allow port $NEW_SSH_PORT/tcp and deny port 22/tcp."

# 5. Install and Configure Fail2Ban
echo "\nStep 5/6: Installing and configuring Fail2Ban..."
apt-get update
apt-get install -y fail2ban
# Create a local config to monitor the new SSH port
JAIL_LOCAL="/etc/fail2ban/jail.local"
echo "[sshd]" > "$JAIL_LOCAL"
echo "enabled = true" >> "$JAIL_LOCAL"
echo "port = $NEW_SSH_PORT" >> "$JAIL_LOCAL"
systemctl enable fail2ban
systemctl restart fail2ban
echo "--> Fail2Ban installed and configured."

# 6. Configure Unattended Upgrades for Email Alerts
echo "\nStep 6/6: Configuring automatic security updates and alerts..."
apt-get install -y unattended-upgrades apt-listchanges
# Set the alert email address in the configuration
sed -i -e "s/^\/\/Unattended-Upgrade::Mail \"root\"/Unattended-Upgrade::Mail \"$ALERT_EMAIL\"/" /etc/apt/apt.conf.d/50unattended-upgrades
echo "--> Unattended upgrades configured to send alerts to '$ALERT_EMAIL'."
# Note: Further mail server (MTA) configuration may be needed for emails to be delivered.

# Finally, restart the SSH service to apply all changes
systemctl restart sshd

echo "\n---------------------------------------------------"
echo "✅ Server Hardening Complete!"
echo "\nIMPORTANT: Your SSH port has changed."
echo "You must now log out and reconnect using:"
echo "ssh ${NEW_USER}@${SERVER_NAME} -p ${NEW_SSH_PORT}"
echo "---------------------------------------------------"

exit 0
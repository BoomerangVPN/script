#!/bin/sh

# This script performs basic security hardening on a fresh Ubuntu server.
# It is designed to be run non-interactively.

set -e # Exit immediately if a command exits with a non-zero status.

# Source the common functions file.
. ./common.sh

# --- Argument Parsing ---
while [ "$#" -gt 0 ]; do
    case "$1" in
        --port) NEW_SSH_PORT="$2"; shift 2;;
        --username) NEW_USER="$2"; shift 2;;
        --password) NEW_PASS="$2"; shift 2;;
        --email) ALERT_EMAIL="$2"; shift 2;;
        --server-name) SERVER_NAME="$2"; shift 2;;
        *) print_error "Unknown parameter passed: $1"; exit 1;;
    esac
done

# --- Validate Arguments ---
if [ -z "$NEW_SSH_PORT" ] || [ -z "$NEW_USER" ] || [ -z "$NEW_PASS" ] || [ -z "$ALERT_EMAIL" ] || [ -z "$SERVER_NAME" ]; then
    print_error "--port, --username, --password, --email, and --server-name are all required."
    exit 1
fi

print_header "--- Starting Server Hardening ---"

# 1. Set Hostname
print_status "Step 1/6: Setting server hostname to '$SERVER_NAME'..."
hostnamectl set-hostname "$SERVER_NAME"
# Update hosts file for local resolution
sed -i "s/127.0.1.1.*/127.0.1.1\t$SERVER_NAME/" /etc/hosts
print_status "--> Hostname updated."

# 2. Create New Sudo User
print_status "Step 2/6: Creating new sudo user '$NEW_USER'..."
useradd -m -s /bin/bash "$NEW_USER"
echo "$NEW_USER:$NEW_PASS" | chpasswd
usermod -aG sudo "$NEW_USER"
print_status "--> User '$NEW_USER' created and added to sudo group."

# 3. Harden SSH Configuration
print_status "Step 3/6: Hardening SSH configuration..."
# Change SSH Port
sed -i -e "s/^#?Port 22/Port $NEW_SSH_PORT/" /etc/ssh/sshd_config
# Disable root login
sed -i -e "s/^#?PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config
# Prioritize Public Key Authentication
sed -i -e "s/^#?PubkeyAuthentication.*/PubkeyAuthentication yes/" /etc/ssh/sshd_config
# Keep password authentication for the new user for now
sed -i -e "s/^#?PasswordAuthentication.*/PasswordAuthentication yes/" /etc/ssh/sshd_config
print_status "--> SSH port changed to $NEW_SSH_PORT, root login disabled."

# 4. Update Firewall for New SSH Port
print_status "Step 4/6: Updating firewall (UFW)..."
ufw allow "$NEW_SSH_PORT"/tcp
# Delete the old rule if it exists. The '|| true' prevents an error if the rule isn't found.
ufw delete allow 22/tcp || true
print_status "--> Firewall updated to allow port $NEW_SSH_PORT/tcp and deny port 22/tcp."

# 5. Install and Configure Fail2Ban
print_status "Step 5/6: Installing and configuring Fail2Ban..."
execute_with_loader "Updating package lists" "apt-get update"
execute_with_loader "Installing Fail2Ban" "apt-get install -y fail2ban"
# Create a local config to monitor the new SSH port
JAIL_LOCAL="/etc/fail2ban/jail.local"
echo "[sshd]" > "$JAIL_LOCAL"
echo "enabled = true" >> "$JAIL_LOCAL"
echo "port = $NEW_SSH_PORT" >> "$JAIL_LOCAL"
systemctl enable fail2ban
systemctl restart fail2ban
print_status "--> Fail2Ban installed and configured."

# 6. Configure Unattended Upgrades for Email Alerts
print_status "Step 6/6: Configuring automatic security updates and alerts..."
execute_with_loader "Installing Unattended Upgrades" "apt-get install -y unattended-upgrades apt-listchanges"

# Set the alert email address in the configuration
sed -i -e "s/^\/\/Unattended-Upgrade::Mail \"root\"/Unattended-Upgrade::Mail \"$ALERT_EMAIL\"/" /etc/apt/apt.conf.d/50unattended-upgrades
print_status "--> Unattended upgrades configured to send alerts to '$ALERT_EMAIL'."
print_warning "Further mail server (MTA) configuration may be needed for emails to be delivered."

# Finally, restart the SSH service to apply all changes
systemctl restart sshd

print_header "✅ Server Hardening Complete! ✅"
print_warning "IMPORTANT: Your SSH port has changed."
print_warning "You must now log out and reconnect using:"
echo "ssh ${NEW_USER}@${SERVER_NAME} -p ${NEW_SSH_PORT}"
print_header "--------------------------------"

exit 0
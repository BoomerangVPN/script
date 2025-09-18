#!/bin/sh

# This script defines functions to install and configure WireGuard on Ubuntu.
# It is intended to be sourced by other scripts.

install_wireguard() {
    set -e
    if [ "$(id -u)" -ne 0 ]; then
       echo "This function must be run as root. Please use 'sudo' or log in as root." 1>&2
       return 1
    fi
    echo "Starting server update and WireGuard installation for Ubuntu..."

    # Step 1: Update package lists
    sudo apt update

    # Step 2: Install WireGuard and UFW firewall
    sudo apt install wireguard ufw -y

    # Step 3: Configure Firewall
    echo "\nConfiguring firewall rules..."
    sudo ufw allow 22/tcp
    sudo ufw allow 51820/udp
    echo "y" | sudo ufw enable
    echo "\nFirewall configured and active."
    
    # Step 4: Enable IP Forwarding
    echo "\nEnabling IP forwarding..."
    sudo sed -i -e 's/^#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
    sudo sysctl -p
    echo "IP forwarding enabled."

    echo "\nOperation complete! WireGuard has been installed."
}

# -----------------------------------------------------------------------------
# --- FUNCTION TO GENERATE CONFIGS (With improved firewall rules) ---
# -----------------------------------------------------------------------------
generate_wireguard_configs() {
    set -e

    # --- Validate Inputs from arguments ---
    local SERVER_ENDPOINT="$1"
    local CLIENT_NAME="$2"

    if [ -z "$SERVER_ENDPOINT" ] || [ -z "$CLIENT_NAME" ]; then
        echo "Error: Server IP/domain and Client Name must be provided as arguments." 1>&2
        return 1
    fi

    # --- Check for Root Privileges ---
    if [ "$(id -u)" -ne 0 ]; then
       echo "This function must be run as root. Please use 'sudo' or log in as root." 1>&2
       return 1
    fi

    if ! command -v wg > /dev/null; then
        echo "WireGuard tools are not installed. Please run the installer first." 1>&2
        return 1
    fi

    echo "\nStarting WireGuard configuration generation..."
    echo "  Server Endpoint: $SERVER_ENDPOINT"
    echo "  Client Name: $CLIENT_NAME"

    # --- Configuration Variables ---
    SERVER_INTERFACE=$(ip -4 route ls | grep default | grep -Po '(?<=dev )(\S+)' | head -1)
    SERVER_VPN_IP="10.10.0.1"
    CLIENT_VPN_IP="10.10.0.2"
    VPN_SUBNET="24"

    # --- Create Directory and Keys ---
    mkdir -p /etc/wireguard
    chmod 700 /etc/wireguard
    cd /etc/wireguard

    echo "\nStep 1/3: Generating cryptographic keys..."
    wg genkey | tee server_private.key | wg pubkey > server_public.key
    wg genkey | tee "${CLIENT_NAME}_private.key" | wg pubkey > "${CLIENT_NAME}_public.key"
    chmod 600 *_private.key

    # --- Read Keys into Variables ---
    SERVER_PRIVATE_KEY=$(cat server_private.key)
    SERVER_PUBLIC_KEY=$(cat server_public.key)
    CLIENT_PRIVATE_KEY=$(cat "${CLIENT_NAME}_private.key")
    CLIENT_PUBLIC_KEY=$(cat "${CLIENT_NAME}_public.key")

    # --- Create Server Configuration ---
    echo "Step 2/3: Creating server configuration file (wg0.conf)..."
    cat << EOF > /etc/wireguard/wg0.conf
[Interface]
Address = ${SERVER_VPN_IP}/${VPN_SUBNET}
ListenPort = 51820
PrivateKey = ${SERVER_PRIVATE_KEY}
# --- IMPROVED FIREWALL RULES ---
# Added rule to explicitly allow return traffic (-o %i)
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${SERVER_INTERFACE} -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${SERVER_INTERFACE} -j MASQUERADE

[Peer]
# Client ID: ${CLIENT_NAME}
PublicKey = ${CLIENT_PUBLIC_KEY}
AllowedIPs = ${CLIENT_VPN_IP}/32
EOF

    # --- Create Client Configuration ---
    echo "Step 3/3: Creating client configuration file (${CLIENT_NAME}.conf)..."
    cat << EOF > "/etc/wireguard/${CLIENT_NAME}.conf"
[Interface]
PrivateKey = ${CLIENT_PRIVATE_KEY}
Address = ${CLIENT_VPN_IP}/32
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = ${SERVER_PUBLIC_KEY}
Endpoint = ${SERVER_ENDPOINT}:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
EOF

    # --- Start and Enable the WireGuard Service ---
    echo "\nStep 4/4: Starting and enabling the WireGuard service..."
    
    # Start the WireGuard interface
    sudo wg-quick up wg0
    
    # Enable the WireGuard service to start on boot
    sudo systemctl enable wg-quick@wg0.service

    echo "\n---------------------------------------------------"
    echo "✅ Setup complete and WireGuard is now RUNNING!"
    echo "\n- Server config: /etc/wireguard/wg0.conf"
    echo "- Client config: /etc/wireguard/${CLIENT_NAME}.conf"
    echo "\n- The WireGuard service has been started and enabled on boot."
    echo "\nYour only remaining step:"
    echo "1. Transfer the '${CLIENT_NAME}.conf' file to your client device."
    echo "---------------------------------------------------"
}
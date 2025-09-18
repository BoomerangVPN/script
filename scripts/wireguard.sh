#!/bin/sh

# This script defines functions to install and configure WireGuard on Ubuntu.
# It is intended to be sourced by other scripts.

# Source the common functions file.
. ./common.sh

install_wireguard() {
    set -e
    if [ "$(id -u)" -ne 0 ]; then
       print_error "This function must be run as root. Please use 'sudo'."
       return 1
    fi
    print_status "Starting server update and WireGuard installation for Ubuntu..."

    # Step 1: Update package lists
    execute_with_loader "Updating package lists" "sudo apt update"

    # Step 2: Install WireGuard and UFW firewall
    execute_with_loader "Installing WireGuard and UFW" "sudo apt install wireguard ufw -y"

    # Step 3: Configure Firewall
    print_status "Configuring firewall rules..."
    sudo ufw allow 22/tcp >/dev/null
    sudo ufw allow 51820/udp >/dev/null
    execute_with_loader "Enabling firewall" "echo y | sudo ufw enable"
    print_status "--> Firewall configured and active."
    
    # Step 4: Enable IP Forwarding
    print_status "Enabling IP forwarding..."
    sudo sed -i -e 's/^#net.ipv4.ip_forward=1/net.ipv4.ip_forward=1/' /etc/sysctl.conf
    sudo sysctl -p >/dev/null
    print_status "--> IP forwarding enabled."

    print_status "WireGuard packages have been installed."
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
        print_error "Server IP/domain and Client Name must be provided as arguments."
        return 1
    fi

    # --- Check for Root Privileges ---
    if [ "$(id -u)" -ne 0 ]; then
       print_error "This function must be run as root. Please use 'sudo'."
       return 1
    fi

    if ! command -v wg > /dev/null; then
        print_error "WireGuard tools are not installed. Please run the installer first."
        return 1
    fi

    print_status "Starting WireGuard configuration generation..."
    print_status "  Server Endpoint: $SERVER_ENDPOINT"
    print_status "  Client Name: $CLIENT_NAME"

    # --- Configuration Variables ---
    SERVER_INTERFACE=$(ip -4 route ls | grep default | grep -Po '(?<=dev )(\S+)' | head -1)
    SERVER_VPN_IP="10.10.0.1"
    CLIENT_VPN_IP="10.10.0.2"
    VPN_SUBNET="24"

    # --- Create Directory and Keys ---
    mkdir -p /etc/wireguard
    chmod 700 /etc/wireguard
    cd /etc/wireguard

    print_status "Step 1/4: Generating cryptographic keys..."
    wg genkey | tee server_private.key | wg pubkey > server_public.key
    wg genkey | tee "${CLIENT_NAME}_private.key" | wg pubkey > "${CLIENT_NAME}_public.key"
    chmod 600 *_private.key

    # --- Read Keys into Variables ---
    SERVER_PRIVATE_KEY=$(cat server_private.key)
    SERVER_PUBLIC_KEY=$(cat server_public.key)
    CLIENT_PRIVATE_KEY=$(cat "${CLIENT_NAME}_private.key")
    CLIENT_PUBLIC_KEY=$(cat "${CLIENT_NAME}_public.key")

    # --- Create Server Configuration ---
    print_status "Step 2/4: Creating server configuration file (wg0.conf)..."
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
    print_status "Step 3/4: Creating client configuration file (${CLIENT_NAME}.conf)..."
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
    print_status "Step 4/4: Starting and enabling the WireGuard service..."
    
    # Start the WireGuard interface
    sudo wg-quick up wg0
    
    # Enable the WireGuard service to start on boot
    execute_with_loader "Enabling WireGuard service on boot" "sudo systemctl enable wg-quick@wg0.service"

    print_header "✅ WireGuard is now RUNNING! ✅"
    print_status "Server config: /etc/wireguard/wg0.conf"
    print_status "Client config: /etc/wireguard/${CLIENT_NAME}.conf"
    print_status "The service has been started and enabled on boot."
}
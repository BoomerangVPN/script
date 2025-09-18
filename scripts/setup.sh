#!/bin/sh

# This is the main setup script. It is fully non-interactive.

# --- Default variables ---
SERVER_PUBLIC_ADDRESS=""
CLIENT_NAME=""

# --- Argument Parsing Loop ---
while [ "$#" -gt 0 ]; do
    case "$1" in
        --ip)
            if [ -z "$2" ]; then echo "Error: --ip flag requires an argument." >&2; exit 1; fi
            SERVER_PUBLIC_ADDRESS="$2"
            shift 2 # Move past the flag and its value
            ;;
        --client)
            if [ -z "$2" ]; then echo "Error: --client flag requires an argument." >&2; exit 1; fi
            CLIENT_NAME="$2"
            shift 2 # Move past the flag and its value
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Usage: sudo $0 --ip <server_ip_or_domain> --client <client_name>" >&2
            exit 1
            ;;
    esac
done

# --- Validate that all required arguments were provided ---
if [ -z "$SERVER_PUBLIC_ADDRESS" ] || [ -z "$CLIENT_NAME" ]; then
    echo "Error: Both --ip and --client arguments are required." >&2
    echo "Usage: sudo $0 --ip <server_ip_or_domain> --client <client_name>" >&2
    exit 1
fi

# --- Main Execution ---

# Source the wireguard function file.
. ./wireguard.sh

echo "--- Starting Full WireGuard Setup ---"

# Step 1: Install WireGuard.
install_wireguard

# Step 2: Generate configs, passing both arguments.
generate_wireguard_configs "$SERVER_PUBLIC_ADDRESS" "$CLIENT_NAME"

echo "\n--- Setup Finished ---"

exit 0
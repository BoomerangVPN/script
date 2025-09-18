#!/bin/sh

# This is the main setup script. It is fully non-interactive.

# Source the common and wireguard function files.
. ./common.sh
. ./wireguard.sh

# --- Default variables ---
SERVER_PUBLIC_ADDRESS=""
CLIENT_NAME=""

# --- Argument Parsing Loop ---
while [ "$#" -gt 0 ]; do
    case "$1" in
        --ip)
            if [ -z "$2" ]; then print_error "--ip flag requires an argument."; exit 1; fi
            SERVER_PUBLIC_ADDRESS="$2"
            shift 2 # Move past the flag and its value
            ;;
        --client)
            if [ -z "$2" ]; then print_error "--client flag requires an argument."; exit 1; fi
            CLIENT_NAME="$2"
            shift 2 # Move past the flag and its value
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Usage: sudo $0 --ip <server_ip_or_domain> --client <client_name>" >&2
            exit 1
            ;;
    esac
done

# --- Validate that all required arguments were provided ---
if [ -z "$SERVER_PUBLIC_ADDRESS" ] || [ -z "$CLIENT_NAME" ]; then
    print_error "Both --ip and --client arguments are required."
    echo "Usage: sudo $0 --ip <server_ip_or_domain> --client <client_name>" >&2
    exit 1
fi

# --- Main Execution ---

print_header "--- Starting Full WireGuard Setup ---"

# Step 1: Install WireGuard.
install_wireguard

# Step 2: Generate configs, passing both arguments.
generate_wireguard_configs "$SERVER_PUBLIC_ADDRESS" "$CLIENT_NAME"

print_header "--- Setup Finished ---"

exit 0
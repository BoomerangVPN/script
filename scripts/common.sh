#!/bin/bash

# common.sh
# Contains common functions and variables used by other scripts.

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to show a spinner while a command executes.
# Usage: execute_with_loader "Descriptive message" "command_to_run"
execute_with_loader() {
    local DESC="$1"
    local CMD="$2"
    local i=0

    echo -n -e "${GREEN}[INFO]${NC} $DESC..."
    
    # Run the command in the background and redirect its output
    sh -c "$CMD" >/dev/null 2>&1 &
    local PID=$!

    # While the command is running, show a spinner
    while kill -0 $PID 2>/dev/null; do
        i=$(( (i+1) % 4 ))
        # --- THIS IS THE CORRECTED PART ---
        # Replaced bash-specific substring with a POSIX-compliant case statement
        case $i in
            0) printf "\b-" ;;
            1) printf "\b\\" ;;
            2) printf "\b|" ;;
            3) printf "\b/" ;;
        esac
        sleep 0.1
    done

    # Check the command's exit status
    wait $PID
    local EXIT_STATUS=$?

    if [ $EXIT_STATUS -eq 0 ]; then
        printf "\b[${GREEN}OK${NC}]\n"
    else
        printf "\b[${RED}FAIL${NC}]\n"
        print_error "The last operation failed with exit code $EXIT_STATUS."
        exit $EXIT_STATUS
    fi
}
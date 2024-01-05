#!/bin/bash
set -o errexit -o nounset -o pipefail

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

# Define the directory for the aggregated JSON files
AGGREGATED_DIR="${SCRIPT_PATH}/schemas/aggregated_msgs"

# Remove the aggregated directory if it exists
rm -rf "${AGGREGATED_DIR}"
# Recreate the aggregated directory
mkdir -p "${AGGREGATED_DIR}"

# Loop through all JSON files in the msgs directory
for json_file in "${SCRIPT_PATH}/schemas/msgs"/*.json; do
    # Check if the file exists
    if [ -f "$json_file" ]; then
        # Get the file name without the extension
        file_name=$(basename "${json_file%.*}")
        
        # Extract the first characters of the file name
        prefix="${file_name%%_*}"
        
        #type="${file_name#*_}"
        
        # Create a new aggregated JSON file with the same prefix
        aggregated_file="${AGGREGATED_DIR}/${prefix}_json_msgs.json"
        
        # If the aggregated file already exists, append the contents of the current JSON file to it
        if [ -f "$aggregated_file" ]; then
            cat "$json_file" >> "$aggregated_file"
        else
            # Otherwise, create the aggregated file and copy the current JSON file contents
            cp "$json_file" "$aggregated_file"
        fi
    fi
done

echo "Aggregated JSON schemas in $AGGREGATED_DIR"

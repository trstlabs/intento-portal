#!/bin/bash
set -o errexit -o nounset -o pipefail

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

rm -rf "${SCRIPT_PATH}/schemas"
# rm -rf "${SCRIPT_PATH}/Trustless-Hub"
# git clone --depth 1 https://github.com/trstlabs/Trustless-Hub "${SCRIPT_PATH}/Trustless-Hub"



TRST_DIR="${SCRIPT_PATH}/Trustless-Hub/proto"
TRST_THIRD_PARTY_DIR="${SCRIPT_PATH}/Trustless-Hub/third_party/proto"


# directory for individual schema files
MSGS_DIR="${SCRIPT_PATH}/schemas/msgs"

INDEX_FILE="${MSGS_DIR}/index.ts"


echo "ddd"
echo "${SCRIPT_PATH}"
echo "${TRST_DIR}"
echo "${TRST_THIRD_PARTY_DIR}"
echo " $(find ${TRST_DIR} ${TRST_THIRD_PARTY_DIR} -path -prune -o -name '*.proto' -print0 | xargs -0)"


# Remove the msgs directory if it exists
rm -rf "${MSGS_DIR}"
# Recreate the msgs directory
mkdir -p "${MSGS_DIR}"

# Generate individual JSON schema files for messages containing "Msg"
find "${TRST_DIR}" "${TRST_THIRD_PARTY_DIR}" -path -prune -o -name '*.proto' -print0 | while IFS= read -r -d '' file; do
    input_dir=$(dirname "${file}")
    
    # Create the output directory if it doesn't exist
    mkdir -p "${MSGS_DIR}"
    
    # Check if the file contains a message with "Msg"
    if grep -q 'message.Msg*' "${file}"; then
        # Generate JSON schema file
        protoc \
        --plugin=$GOPATH/bin/protoc-gen-jsonschema \
        --jsonschema_out=${MSGS_DIR} \
        --jsonschema_opt=prefix_schema_files_with_package \
        --proto_path="${TRST_DIR}" \
        --proto_path="${TRST_THIRD_PARTY_DIR}" \
        "${file}"
        
    fi
done

# Loop through all subdirectories in MSGS_DIR
for dir in "$MSGS_DIR"/*; do
    # Check if it is a directory
    if [ -d "$dir" ]; then
        # Get the directory name and replace dots with underscores
        dir_name=$(basename "$dir" | tr '.' '_')

        # Loop through all files in the subdirectory
        for file in "$dir"/*; do
            # Check if it is a file
            if [ -f "$file" ]; then
                # Get the file name
                file_name=$(basename "$file")

                # Generate the new file name with the prefix
                new_file_name="${dir_name}_${file_name}"

                # Move the file to the parent directory
                mv "$file" "$MSGS_DIR/$new_file_name"
            fi
        done

        # Remove the subdirectory
        rm -r "$dir"
    fi
done


# cat "${MSGS_DIR}"/*.json > "${OUTPUT_FILE}"
# Iterate over all JSON files in the msgs directory
for json_file in "${MSGS_DIR}"/*.json; do
    # Check if the file exists
    if [ -f "$json_file" ]; then
        # Get the file name without the extension
        file_name=$(basename "${json_file%.*}")
        
        # Check if the file name starts with "Msg" and does not end with "Response"
        if [[ "$file_name" == *Msg* && "$file_name" != *Response ]]; then
            
            # # Convert the keys in the "properties" section of all definitions to camelCase
            updated_json=$(cat "$json_file" | jq '
            def snake_to_camel:
            gsub( "_(?<a>[a-z])"; .a|ascii_upcase);

            walk(if type == "object" then with_entries(.key |= snake_to_camel) else . end)

            ')
            
            # Overwrite the file with the modified JSON
            echo "$updated_json" > "${MSGS_DIR}"/"$file_name"+"_tmp".json
            
            jq 'del(."$schema")' "${MSGS_DIR}"/"$file_name"+"_tmp".json > "$json_file"
            
            # Add an export statement to the index.ts file
            echo "export { default as $file_name } from './$(basename "$json_file")';" >> "$INDEX_FILE"
            rm "${MSGS_DIR}"/"$file_name"+"_tmp".json
        else
            rm "${MSGS_DIR}"/"$file_name".json
        fi
    fi
done



# rm updated_json.json


echo "Generated msg schemas and index.ts file in $MSGS_DIR"

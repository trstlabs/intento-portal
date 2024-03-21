#!/bin/bash
set -o errexit -o nounset -o pipefail

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

rm -rf "${SCRIPT_PATH}/schemas"
# rm -rf "${SCRIPT_PATH}/Trustless-Hub"
# git clone --depth 1 https://github.com/trstlabs/Trustless-Hub "${SCRIPT_PATH}/Trustless-Hub"



INTO_DIR="${SCRIPT_PATH}/Trustless-Hub/proto"
INTO_THIRD_PARTY_DIR="${SCRIPT_PATH}/Trustless-Hub/third_party/proto"


# directory for individual schema files
MSGS_DIR="${SCRIPT_PATH}/schemas/msgs"

INDEX_FILE="${MSGS_DIR}/index.ts"

echo "${SCRIPT_PATH}"
echo "${INTO_DIR}"
echo "${INTO_THIRD_PARTY_DIR}"
echo " $(find ${INTO_DIR} ${INTO_THIRD_PARTY_DIR} -path -prune -o -name '*.proto' -print0 | xargs -0)"


# Remove the msgs directory if it exists
rm -rf "${MSGS_DIR}"
# Recreate the msgs directory
mkdir -p "${MSGS_DIR}"

# Generate individual JSON schema files for messages containing "Msg"
find "${INTO_DIR}" "${INTO_THIRD_PARTY_DIR}" -path -prune -o -name '*.proto' -print0 | while IFS= read -r -d '' file; do
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
        --jsonschema_opt=disallow_additional_properties \
        --jsonschema_opt=enums_as_constants \
        --jsonschema_opt=enums_as_strings_only \
        --proto_path="${INTO_DIR}" \
        --proto_path="${INTO_THIRD_PARTY_DIR}" \
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

# Iterate over all JSON files in the msgs directory
for json_file in "${MSGS_DIR}"/*.json; do
    # Check if the file exists
    if [ -f "$json_file" ]; then
        # Get the file name without the extension
        file_name=$(basename "${json_file%.*}")
        
        # Check if the file name starts with "Msg" and does not end with "Response"
        if [[ "$file_name" == *Msg* && "$file_name" != *Response ]]; then
            
            # Convert the keys in the "properties" section of all definitions to camelCase
            # Set additionalProperties to true at the correct level
            # Remove specific 'value' object
            updated_json=$(cat "$json_file" | jq '
            def snake_to_camel:
            gsub( "_(?<a>[a-z])"; .a|ascii_upcase);

            def add_additional_properties:
                if type == "object" then
                    if any(values[]; type == "object" and has("typeUrl")) then
                        . + {"additionalProperties": true}
                    else
                        with_entries(if .value | type == "object" then .value |= add_additional_properties else . end)
                    end
                else
                    .
                end;

            walk(if type == "object" then with_entries(.key |= snake_to_camel) else . end) |
            walk(if type == "object" and .msg? and .msg.type == "string" and .msg.format == "binary" then .msg = {
                "type": "object",
                "description": "is an object and will be encoded to a string before submission .",
                "additionalProperties": true
            } else . end) |
            walk(add_additional_properties) |
            walk(if type == "object" and .value? and .value.type == "string" and .value.description == "Must be a valid serialized protocol buffer of the above specified type." and .value.format == "binary" and .value.binaryEncoding == "base64" then del(.value) else . end)
            ')
            
            # Overwrite the file with the modified JSON
            echo "$updated_json" > "${MSGS_DIR}"/"$file_name"+"_tmp".json
            
            # Remove the "$schema" key
            jq 'del(."$schema")' "${MSGS_DIR}"/"$file_name"+"_tmp".json > "$json_file"
            
            # Add an export statement to the index.ts file
            echo "export { default as $file_name } from './$(basename "$json_file")';" >> "$INDEX_FILE"
            rm "${MSGS_DIR}"/"$file_name"+"_tmp".json
        else
            rm "${MSGS_DIR}"/"$file_name".json
        fi
    fi
done




echo "Generated msg schemas and index.ts file in $MSGS_DIR"

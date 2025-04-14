#!/bin/bash
set -o errexit -o nounset -o pipefail

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

#rm -rf "${SCRIPT_PATH}/schemas"
# rm -rf "${SCRIPT_PATH}/Trustless-Hub"
# git clone --depth 1 https://github.com/trstlabs/Trustless-Hub "${SCRIPT_PATH}/Trustless-Hub"



INTO_DIR="${SCRIPT_PATH}/Trustless-Hub/third_party/proto"
INTO_THIRD_PARTY_DIR="${SCRIPT_PATH}/Trustless-Hub/proto"


# directory for individual schema files
MSGS_DIR="${SCRIPT_PATH}/schemas/msgs"

INDEX_FILE="${MSGS_DIR}/index.ts"

# echo "${SCRIPT_PATH}"
# echo "${INTO_DIR}"
# echo "${INTO_THIRD_PARTY_DIR}"
# echo " $(find ${INTO_DIR} ${INTO_THIRD_PARTY_DIR} -path -prune -o -name '*.proto' -print0 | xargs -0)"


# Remove the msgs directory if it exists
# rm -rf "${MSGS_DIR}"
# Recreate the msgs directory
# mkdir -p "${MSGS_DIR}"

# Remove old generated schemas
# rm -rf schemas/msgs

#Run buf generate
cd ${SCRIPT_PATH}/ibc-go-main/proto
proto_dirs=$(find ./ -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
for dir in $proto_dirs; do
  for file in $(find "${dir}" -maxdepth 1 -name '*.proto'); do
    if grep go_package "$file" &>/dev/null; then
      buf generate --template ${SCRIPT_PATH}/buf.gen.yaml "$file"
    fi
  done
done

cd ${SCRIPT_PATH}/cosmos-sdk-main/proto
proto_dirs=$(find ./ -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
for dir in $proto_dirs; do
  for file in $(find "${dir}" -maxdepth 1 -name '*.proto'); do
    if grep go_package "$file" &>/dev/null; then
      buf generate --template ${SCRIPT_PATH}/buf.gen.yaml "$file"
    fi
  done
done


cd ${SCRIPT_PATH}/wasmd-main/proto
proto_dirs=$(find ./ -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
for dir in $proto_dirs; do
  for file in $(find "${dir}" -maxdepth 1 -name '*.proto'); do
    if grep go_package "$file" &>/dev/null; then
      buf generate --template ${SCRIPT_PATH}/buf.gen.yaml "$file"
    fi
  done
done

cd ${SCRIPT_PATH}/intento/proto
proto_dirs=$(find ./ -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
for dir in $proto_dirs; do
  for file in $(find "${dir}" -maxdepth 1 -name '*.proto'); do
    if grep go_package "$file" &>/dev/null; then
      buf generate --template ${SCRIPT_PATH}/buf.gen.yaml "$file"
    fi
  done
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

SCHEMA_NAMES_FILE="${MSGS_DIR}/schemaNames.ts"
echo "export const schemaNames = [" > "$SCHEMA_NAMES_FILE"

# Iterate over all JSON files in the msgs directory
for json_file in "${MSGS_DIR}"/*.json; do
    if [ -f "$json_file" ]; then
        file_name=$(basename "${json_file%.*}")
        
        if [[ "$file_name" == *Msg* && "$file_name" != *Response ]]; then
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

            echo "$updated_json" > "${MSGS_DIR}"/"$file_name"+"_tmp".json
            jq 'del(."$schema")' "${MSGS_DIR}"/"$file_name"+"_tmp".json > "$json_file"
            rm "${MSGS_DIR}"/"$file_name"+"_tmp".json

            # Add to schemaNames list
            echo "  \"$file_name\"," >> "$SCHEMA_NAMES_FILE"
        else
            rm "${MSGS_DIR}"/"$file_name".json
        fi
    fi
done

echo "] as const;" >> "$SCHEMA_NAMES_FILE"

echo "Generated msg schemas and schemaNames.ts file in $MSGS_DIR"

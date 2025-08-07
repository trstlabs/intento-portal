#!/bin/bash
set -o errexit -o nounset -o pipefail

SCRIPT_PATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

# directory for individual schema files
MSGS_DIR="${SCRIPT_PATH}/schemas/msgs"
SCHEMAS_DIR="${SCRIPT_PATH}/schemas"

INDEX_FILE="${MSGS_DIR}/index.ts"

# Remove the msgs directory if it exists
# rm -rf "${MSGS_DIR}"
# Recreate the msgs directory
# mkdir -p "${MSGS_DIR}"

# Remove old generated schemas
# rm -rf schemas/msgs

#Run buf generate
# cd ${SCRIPT_PATH}/ibc-go-main/proto
# proto_dirs=$(find ./ -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
# for dir in $proto_dirs; do
#   for file in $(find "${dir}" -maxdepth 1 -name '*.proto'); do
#     if grep go_package "$file" &>/dev/null; then
#       buf generate --template ${SCRIPT_PATH}/buf.gen.yaml "$file"
#     fi
#   done
# done

# cd ${SCRIPT_PATH}/cosmos-sdk-main/proto
# proto_dirs=$(find ./ -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
# for dir in $proto_dirs; do
#   for file in $(find "${dir}" -maxdepth 1 -name '*.proto'); do
#     if grep go_package "$file" &>/dev/null; then
#       buf generate --template ${SCRIPT_PATH}/buf.gen.yaml "$file"
#     fi
#   done
# done


# cd ${SCRIPT_PATH}/wasmd-main/proto
# proto_dirs=$(find ./ -path -prune -o -name '*.proto' -print0 | xargs -0 -n1 dirname | sort | uniq)
# for dir in $proto_dirs; do
#   for file in $(find "${dir}" -maxdepth 1 -name '*.proto'); do
#     if grep go_package "$file" &>/dev/null; then
#       buf generate --template ${SCRIPT_PATH}/buf.gen.yaml "$file"
#     fi
#   done
# done

# Ensure the output directory exists
mkdir -p "$MSGS_DIR"

# Clean up any existing schema files
echo "Cleaning up existing schema files..."
rm -f "${MSGS_DIR}"/*.json
rm -f "${MSGS_DIR}"/schemaNames.ts

# Change to the proto directory
cd "${SCRIPT_PATH}/proto"

# Find all proto files that have a go_package
echo "Finding proto files..."
proto_files=$(find . -name '*.proto' -type f -exec grep -l "go_package" {} +)

if [ -z "$proto_files" ]; then
  echo "No proto files found with go_package directive"
  exit 1
fi

# Create a temporary directory for the buf.gen.yaml file
TEMP_DIR=$(mktemp -d)
TEMP_BUF_GEN="${TEMP_DIR}/buf.gen.yaml"

# Create the buf.gen.yaml file with the correct output path
cat > "$TEMP_BUF_GEN" << EOL
version: v1
plugins:
  - name: jsonschema
    out: ${MSGS_DIR}
    strategy: all
    opt:
      - plugins=grpc,Mgoogle/protobuf/any.proto=github.com/cosmos/cosmos-sdk/codec/types,Mcosmos/orm/v1/orm.proto=cosmossdk.io/orm
      - prefix_schema_files_with_package
      - disallow_additional_properties
      - enums_as_constants
      - enums_as_strings_only
EOL

echo "Using temporary buf.gen.yaml at: $TEMP_BUF_GEN"
cat "$TEMP_BUF_GEN"

# Process each proto file
echo "Processing proto files..."
for file in $proto_files; do
  echo "Generating code for: $file"
  # Generate JSON schemas using buf with the temporary config
  buf generate --template "$TEMP_BUF_GEN" "$file"
done

# Clean up the temporary directory
rm -rf "$TEMP_DIR"

# Process subdirectories to rename files with directory prefix
echo "Processing subdirectories to rename files with directory prefix..."
find "${MSGS_DIR}" -mindepth 1 -type d | while read -r dir; do
    # Get the directory name and replace dots with underscores
    dir_name=$(basename "$dir" | tr '.' '_' | tr '-' '_' | tr '[:upper:]' '[:lower:]')
    echo "Processing directory: $dir (as $dir_name)"
    
    # Process each file in the directory
    find "$dir" -maxdepth 1 -type f -name "*.json" | while read -r file; do
        # Get the base filename
        file_name=$(basename "$file")
        
        # Generate the new file name with the prefix
        new_file_name="${dir_name}_${file_name}"
        echo "  Renaming $file_name to $new_file_name"
        
        # Move the file to the parent directory with the new name
        mv "$file" "${MSGS_DIR}/${new_file_name}"
    done
    
    # Remove the now empty directory
    rmdir "$dir" 2>/dev/null || true
done

# Generate schemaNames.ts file
echo "Generating schemaNames.ts file..."

# Create the schemaNames.ts file with the header
cat > "${MSGS_DIR}/schemaNames.ts" << 'EOL'
export const schemaNames = [
EOL

# Find all JSON files with 'Msg' in their name and add them to schemaNames.ts
find "${MSGS_DIR}" -maxdepth 1 -type f -name "*.json" | while read -r file; do
  # Get the base filename without extension
  base_name=$(basename "$file" .json)
  
  # Skip files with 'Response' in the name
  # Skip files with 'Query' that don't have 'Msg' in the name
  if [[ "$base_name" != *"Response"* ]] && 
     ([[ "$base_name" == *"Msg"* ]] || 
      [[ "$base_name" != *"Query"* ]]); then
    # The filename already contains the package prefix from the directory
    echo "  \"$base_name\"," >> "${MSGS_DIR}/schemaNames.ts"
  fi
done

# Close the array
echo '] as const;' >> "${MSGS_DIR}/schemaNames.ts"

echo 'export type SchemaNames = (typeof schemaNames)[number];' >> "${MSGS_DIR}/schemaNames.ts"

echo "Generated schemaNames.ts file with message schemas"

# Change to the script's directory to ensure consistent paths
cd ${SCRIPT_PATH}

# Ensure MSGS_DIR exists
mkdir -p "$MSGS_DIR"

# Verify JSON files were generated
echo "Looking for JSON files in: $MSGS_DIR"
find "$MSGS_DIR" -name "*.json" | head -n 5

# Process files in the _msgs directory
if [ -d "${SCHEMAS_DIR}/_msgs" ]; then
    echo "Found _msgs directory, processing files..."
    # Ensure the msgs directory exists
    mkdir -p "$MSGS_DIR"
    
    # Move all JSON files from _msgs to msgs
    find "${SCHEMAS_DIR}/_msgs" -name '*.json' -exec mv -v {} "$MSGS_DIR/" \;
    
    # Remove the _msgs directory if it's empty
    rmdir "${SCHEMAS_DIR}/_msgs" 2>/dev/null || true
fi

# Create or clear the schemaNames.ts file
SCHEMA_NAMES_FILE="${MSGS_DIR}/schemaNames.ts"
echo "export const schemaNames = [" > "$SCHEMA_NAMES_FILE"

# Process all JSON files in the msgs directory
for json_file in "${MSGS_DIR}"/*.json; do
    if [ -f "$json_file" ]; then
        file_name=$(basename "${json_file%.*}")
        
        # Only process files that contain 'Msg' and don't end with 'Response'
        if [[ "$file_name" == *Msg* && "$file_name" != *Response ]]; then
            echo "Processing $file_name..."
            
            # Process the JSON file to format it correctly
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

            # Create a temporary file for the updated JSON
            echo "$updated_json" > "${MSGS_DIR}/${file_name}_tmp.json"
            
            # Remove the $schema field and save the final JSON
            jq 'del(."$schema")' "${MSGS_DIR}/${file_name}_tmp.json" > "$json_file"
            rm "${MSGS_DIR}/${file_name}_tmp.json"

            # Add to schemaNames list
            echo "  \"$file_name\"," >> "$SCHEMA_NAMES_FILE"
        else
            # Remove files that don't match our criteria
            rm -f "$json_file"
        fi
    fi
done

# Close the array in schemaNames.ts
echo "] as const;" >> "$SCHEMA_NAMES_FILE"


# Generate index.ts that exports all JSON files
echo "Generating index.ts file..."
INDEX_FILE="${MSGS_DIR}/index.ts"
echo "// Auto-generated index file that exports all JSON schema files" > "$INDEX_FILE"
echo "// This file is automatically generated by generate-schema.sh" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

# Add export for each JSON file
for json_file in "${MSGS_DIR}"/*.json; do
    if [ -f "$json_file" ]; then
        file_name=$(basename "${json_file%.*}")
        echo "export { default as $file_name } from './$file_name.json';" >> "$INDEX_FILE"
    fi
done

# Add export for schemaNames
echo -e "\n// Export schema names" >> "$INDEX_FILE"
echo 'export * from "./schemaNames";' >> "$INDEX_FILE"

echo "Generated index.ts file with all schema exports"

echo "Generated msg schemas and schemaNames.ts file in $MSGS_DIR"

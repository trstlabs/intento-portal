
# Generate JSON schemas based on the proto messages from the related repos, clones repos and uses protoc to convert to JSON with camelCase style inputs. 
generate-schema:
	./util/scripts/generate-schema.sh

# After generating schema, ann agggregate schemas can be used for GPT knowledge base input (cosmos, cosmwasm, ibc, osmosis)
aggregate-schema:
	bash ./util/scripts/aggregate-schema.sh

dev:  yarn dev

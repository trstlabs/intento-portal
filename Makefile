

.PHONY: run-localtrst

# Generate JSON schemas based on the proto messages from the related repos, clones repos and uses protoc to convert to JSON with camelCase style inputs. 
generate-schema:
	./util/scripts/generate-schema.sh

# After generating schema, ann agggregate schemas can be used for GPT knowledge base input (cosmos, cosmwasm, ibc, osmosis)
aggregate-schema:
	bash ./util/scripts/aggregate-schema.sh

### users to test and play around with:
#   a_mnemonic="grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar"
#   b_mnemonic="jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow"
#   c_mnemonic="chair love bleak wonder skirt permit say assist aunt credit roast size obtain minute throw sand usual age smart exact enough room shadow charge"
#   d_mnemonic="word twist toast cloth movie predict advance crumble escape whale sail such angry muffin balcony keen move employ cook valve hurt glimpse breeze brick"

build-hermes:
	docker build -f localtrst/hermes/hermes.Dockerfile -t hermes:v0.0.0 localtrst/hermes

run-localibc: build-hermes
	docker compose -f localtrst/docker-compose.yml up

kill-localibc:
	docker compose -f localtrst/docker-compose.yml stop 
	docker compose -f localtrst/docker-compose.yml rm -f 

localtrst: localtrst
	cd localtrst && yarn && npx jest --forceExit

dev:  yarn dev



.PHONY: run-localtrst

# When you run localtrst again, remove Trustless Hub from kelr and add it again. Encryptionutils has to be defined again. 
# Otherwise you'll get an error when sending transactions ( enrypted: ). Also unpin and re-add keyring.
run-localtrst: # CTRL+C to stop
	docker compose -f localtrst/docker-compose-local.yml up

kill-localtrst:
	docker compose -f localtrst/docker-compose-local.yml stop 
	docker compose -f localtrst/docker-compose-local.yml rm -f 

# After make run-localtrst is streaming blocks, this will setup TIP20 tokens, the AMM and send some TRST and ETH to user "b"
setup-dex:
	(cd localtrst && ./setup-dex.sh)


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

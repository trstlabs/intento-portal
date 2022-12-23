#!/bin/bash

set -xe


function wait_for_tx() {
    until (trstd q tx "$1"); do
        sleep 5
    done
}

rm -rf ~/.trstd

trstd config chain-id trstdev-1
trstd config output json
trstd config keyring-backend test

a_mnemonic="grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar"
b_mnemonic="jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow"
c_mnemonic="chair love bleak wonder skirt permit say assist aunt credit roast size obtain minute throw sand usual age smart exact enough room shadow charge"
d_mnemonic="word twist toast cloth movie predict advance crumble escape whale sail such angry muffin balcony keen move employ cook valve hurt glimpse breeze brick"

echo $a_mnemonic | trstcli keys add a --recover
echo $b_mnemonic | trstd keys add b --recover
echo $c_mnemonic | trstd keys add c --recover
echo $d_mnemonic | trstd keys add d --recover

export deployer_name=b
export chain_id=trstdev-1
export wasm_path=./build

trstd config chain-id trstdev-1

export deployer_address=$(trstd keys show -a $deployer_name  )
echo "Deployer address: '$deployer_address'"

export test_name=c
export test_address=$(trstd keys show -a $test_name  )
echo "test address: '$test_address'"

trstd tx compute store "${wasm_path}/keyring.wasm" --from "$deployer_name" -b block  --gas 4000000  --fees 500utrst --output json -y --duration 0 --interval 0 --contract-title ''$iter' Keyring' --contract-description 'Keyring Contract. Allows you to access multiple tokens and NFTs using just one key. Contract code available at github.com/trstlabs/'
keyring_code_id=$(trstd query compute list-codes | jq '.[-1]."id"')
keyring_code_hash=$(trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored token: '$keyring_code_id', '$keyring_code_hash'"

trstd tx compute store "${wasm_path}/tip20.wasm" --from "$deployer_name" -b block  --gas 4000000  --fees 500utrst -y --duration 0 --interval 0 --contract-title 'TIP20 Token' --contract-description 'CosmWasm Representative Token (Privacy-first & on-chain). This contract code is used for TrustlessContract-based tokens and TrustlessContract-based versions of public tokens (e.g. ATOM/JUNO/OSMO/TRST). Similar in functionality to ERC20, CW20,SNIP20. Contract code available at github.com/trstlabs/'
token_code_id=$(trstd query compute list-codes | jq '.[-1]."id"')
token_code_hash=$(trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored token: '$token_code_id', '$token_code_hash'"

trstd tx compute store "${wasm_path}/dex_factory.wasm" --from "$deployer_name" -b block  --gas 3000000 --fees 500utrst -y --duration 0  --interval 0 --contract-title 'DEX - Factory' --contract-description 'This contract code is a factory contract for TrustlessContract-based DEXes with autoswap capabilities. Contract code available at github.com/trstlabs /'
factory_code_id=$(trstd query compute list-codes | jq '.[-1]."id"')
factory_code_hash=$(trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored factory: '$factory_code_id'"

trstd tx compute store "${wasm_path}/swap_pair.wasm" --from "$deployer_name" -b block  --gas 3500000  --fees 500utrst -y --duration 0  --interval 0  --contract-title 'DEX - Token Pair' --contract-description 'This contract code is a pair contract for TrustlessContract-based tokens. It can also instante AutoSwaps on behalf or users. Contract code available at github.com/trstlabs /'
pair_code_id=$(trstd query compute list-codes | jq '.[-1]."id"')
pair_code_hash=$(trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored pair: '$pair_code_id', '$pair_code_hash'"

trstd tx compute store "${wasm_path}/swap_router.wasm" --from "$deployer_name" -b block  --gas 3000000 --fees 500utrst -y --duration 0   --interval 0  --contract-title 'DEX - Swap Router' --contract-description 'This contract code is a router for TrustlessContract-based token pairs. Contract code available at github.com/trstlabs /'
router_code_id=$(trstd query compute list-codes | jq '.[-1]."id"')
router_code_hash=$(trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored router: '$router_code_id', '$router_code_hash'"

trstd tx compute store "${wasm_path}/recurring_send_multi_ibc.wasm" --from "$deployer_name" --keyring-backend test --chain-id "$chain_id" --gas 3000000 --fees 500utrst -b block -y --contract-title 'Recurring Send Multi IBC' --contract-description 'This contract code is for sending recurring transactions to multiple addresses, even over IBC, with only 1-click. It is an extention to TIP20 contract code. Contract code available at github.com/trstlabs/' --duration 100s --interval 40s
recurring_send_ibc_code_id=$( trstd query compute list-codes | jq '.[-1]."id"')
recurring_send_ibc_code_hash=$( trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored recurring send code: '$recurring_send_ibc_code_id', '$recurring_send_ibc_code_hash'"

trstd tx compute store "${wasm_path}/recurring_swap.wasm" --from "$deployer_name" --keyring-backend test --chain-id "$chain_id" --gas 3000000 --fees 500utrst  -b block -y  --contract-title 'Recurring Swap - TIP20 extention' --contract-description 'This contract code is for recurring swaps. It is an extention to TIP20 contract code, and can be used in other contract codes. Contract code available at github.com/trstlabs/'  --duration 100s --interval 40s
recurring_swap_code_id=$(trstd query compute list-codes | jq '.[-1]."id"')
recurring_swap_code_hash=$(trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored recurring swap code: '$recurring_swap_code_id', '$recurring_swap_code_hash'"

echo "Deploying AMM factory..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $factory_code_id '{"pair_code_id": '$pair_code_id', "pair_code_hash": '$pair_code_hash', "token_code_id": '$token_code_id', "token_code_hash": '$token_code_hash', "fee_auto_msg": 0, "fee_recurring_auto_msg":0,"prng_seed": "YWE="}' --contract_id BackSwap --from $deployer_name -b sync --gas 3000000 --fees 700utrst -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

factory_contract=$(trstd query compute list-contracts-by-code $factory_code_id | jq '.[-1].address')
echo "Factory address: '$factory_contract'"

echo "Deploying Keyring..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $keyring_code_id '{"prng_seed":"YWE="}' --contract_id Keyring --from $deployer_name  --output json --gas 3000000 --fees 700utrst -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

keyring_contract=$(trstd query compute list-contracts-by-code $keyring_code_id | jq '.[-1].address')
echo "Keyring address: '$keyring_contract'"

echo "Deploying ETH..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $token_code_id '{"admin": "'$deployer_address'", "symbol": "TETH", "decimals": 18, "initial_balances": [{"address": "'$deployer_address'", "amount": "100000000000000000000000"}],  "prng_seed": "YWE=", "name": "test", "config":{"public_total_supply":true,"enable_deposit":true,"enable_redeem":true}, "keyring": {"contract": '$keyring_contract', "code_hash":'$keyring_code_hash'}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst --gas 1500000 --contract_id TETH -b block -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

eth_addr=$(trstd query compute list-contracts-by-code $token_code_id | jq '.[-1].address')
echo "ETH address: '$eth_addr'"

echo "Deploying ATOM..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $token_code_id '{"admin": "'$deployer_address'", "symbol": "TATOM", "decimals": 18, "initial_balances": [{"address": "'$deployer_address'", "amount": "10000000000000000000000"}], "prng_seed": "YWE=", "name": "test", "config":{"public_total_supply":true,"enable_deposit":true,"enable_redeem":true}, "keyring": {"contract": '$keyring_contract', "code_hash":'$keyring_code_hash'}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst --gas 1500000 --contract_id TATOM -b block -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH


atom_addr=$(trstd query compute list-contracts-by-code $token_code_id | jq '.[-1].address')
echo "ATOM address: '$atom_addr'"

echo "Deploying TRST..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $token_code_id '{"admin": "'$deployer_address'", "symbol": "TTRST", "decimals": 6, "initial_balances": [{"address": "'$deployer_address'", "amount": "100000000000000000000000"}], "prng_seed": "YWE=", "name": "test","config":{"public_total_supply":true,"enable_deposit":true,"enable_redeem":true}, "keyring": {"contract": '$keyring_contract', "code_hash":'$keyring_code_hash'}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst --gas 1500000 --contract_id TTRST -b block -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

trst_addr=$(trstd query compute list-contracts-by-code $token_code_id | jq '.[-1].address')
echo "TTRST address: '$trst_addr'"

echo "Deploying TOSMO..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $token_code_id '{"admin": "'$deployer_address'", "symbol": "TOSMO", "decimals": 8, "initial_balances": [{"address": "'$deployer_address'", "amount": "1000000000000000"}], "prng_seed": "YWE=", "name": "test","config":{"public_total_supply":true,"enable_deposit":true,"enable_redeem":true},  "keyring": {"contract": '$keyring_contract', "code_hash":'$keyring_code_hash' }}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst --gas 1500000 --contract_id TOSMO -b block -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

osmo_addr=$(trstd query compute list-contracts-by-code $token_code_id | jq '.[-1].address')
echo "TATOM address: '$osmo_addr'"

echo "Deploying router..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $router_code_id '{"register_tokens":[{"address":'$trst_addr',"code_hash":'$token_code_hash'},{"address":'$eth_addr',"code_hash":'$token_code_hash'},{"address":'$atom_addr',"code_hash":'$token_code_hash'}, {"address":'$osmo_addr',"code_hash":'$token_code_hash'}]}' --contract_id router --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

router_contract=$(trstd query compute list-contracts-by-code $router_code_id | jq '.[-1].address')
echo "Router address: '$router_contract'"


wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

echo "Creating TETH/TTRST pair..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute execute --contract_id BackSwap '{"create_pair": {"asset_infos": [{"token": {"contract_addr": '$eth_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}},{"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}], "keyring_address": '$keyring_contract', "keyring_code_hash": '$keyring_code_hash'}}' --from $deployer_name -b block   --gas 3000000 --fees 600utrst -y -b block |
    jq -r .txhash
)

wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

pair_contract_eth_TTRST=$(trstd query compute list-contracts-by-code $pair_code_id | jq '.[-1].address')
echo "TETH/TTRST Pair contract address: '$pair_contract_eth_TTRST'"

docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$eth_addr" | tr -d '"') '{"increase_allowance": {"spender": '$pair_contract_eth_TTRST', "amount": "10000000000000000000"}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$trst_addr" | tr -d '"') '{"increase_allowance": {"spender": '$pair_contract_eth_TTRST', "amount": "1000000000000000000000"}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$pair_contract_eth_TTRST" | tr -d '"') '{"provide_liquidity": {"assets": [{"info": {"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}, "amount": "1000000000000000000000"}, {"info": {"token": {"contract_addr": '$eth_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}, "amount": "10000000000000000000"}]}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block

echo "Creating TATOM/TTRST pair..."

docker exec localtrst-localtrst-1 trstd tx compute execute --contract_id BackSwap '{"create_pair": {"asset_infos": [{"token": {"contract_addr": '$atom_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}},{"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}], "keyring_address": '$keyring_contract', "keyring_code_hash": '$keyring_code_hash'}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block

pair_contract_atom_TTRST=$(trstd query compute list-contracts-by-code $pair_code_id | jq '.[-1].address')
echo "TATOM/TTRST Pair contract address: '$pair_contract_atom_TTRST'"

docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$atom_addr" | tr -d '"') '{"increase_allowance": {"spender": '$pair_contract_atom_TTRST', "amount": "100000000000"}}' -b block -y --from $deployer_name  -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$trst_addr" | tr -d '"') '{"increase_allowance": {"spender": '$pair_contract_atom_TTRST', "amount": "200000000000"}}' -b block -y --from $deployer_name  -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$pair_contract_atom_TTRST" | tr -d '"') '{"provide_liquidity": {"assets": [{"info": {"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}, "amount": "200000000000"}, {"info": {"token": {"contract_addr": '$atom_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}, "amount": "100000000000"}]}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block


echo "Creating TOSMO/TTRST pair..."

docker exec localtrst-localtrst-1 trstd tx compute execute --contract_id BackSwap '{"create_pair": {"asset_infos": [{"token": {"contract_addr": '$osmo_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}},{"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}], "keyring_address": '$keyring_contract', "keyring_code_hash": '$keyring_code_hash'}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block

pair_contract_osmo_TTRST=$(trstd query compute list-contracts-by-code $pair_code_id | jq '.[-1].address')
echo "TATOM/TTRST Pair contract address: '$pair_contract_osmo_TTRST'"

docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$osmo_addr" | tr -d '"') '{"increase_allowance": {"spender": '$pair_contract_osmo_TTRST', "amount": "100000000000"}}' -b block -y --from $deployer_name  -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$trst_addr" | tr -d '"') '{"increase_allowance": {"spender": '$pair_contract_osmo_TTRST', "amount": "200000000000"}}' -b block -y --from $deployer_name  -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$pair_contract_osmo_TTRST" | tr -d '"') '{"provide_liquidity": {"assets": [{"info": {"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}, "amount": "200000000000"}, {"info": {"token": {"contract_addr": '$osmo_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}, "amount": "10000000000"}]}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block

echo "Creating TRST/TTRST pair..."

docker exec localtrst-localtrst-1 trstd tx compute execute --contract_id BackSwap '{"create_pair": {"asset_infos": [{"native_token": {"denom": "utrst"}},{"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}],"keyring_address": '$keyring_contract', "keyring_code_hash": '$keyring_code_hash'}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block

pair_contract_TTRST_trst=$(trstd query compute list-contracts-by-code $pair_code_id | jq '.[-1].address')
echo "TRST/TTRST Pair contract address: '$pair_contract_TTRST_trst'"


docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$trst_addr" | tr -d '"') '{"increase_allowance": {"spender": '$pair_contract_TTRST_trst', "amount": "5000000000"}}' -b block -y   --from $deployer_name -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$pair_contract_TTRST_trst" | tr -d '"') '{"provide_liquidity": {"assets": [{"info": {"native_token": {"denom": "utrst"}}, "amount": "5000000000"}, {"info": {"token": {"contract_addr": '$trst_addr', "token_code_hash": '$token_code_hash', "viewing_key": ""}}, "amount": "5000000000"}]}}' --from $deployer_name -b block   --gas 3000000 --fees 500utrst --amount 5000000000utrst -y --gas 1500000 -b block

trstd tx bank send $deployer_name $(echo "$trst_addr" | tr -d '"') 100000000utrst -y -b block -b block   --gas 3000000 --fees 500utrst
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$eth_addr" | tr -d '"') '{"transfer":{"recipient":'$factory_contract',"amount":"1000000000000000000000"}}' -y -b block   --from "$deployer_name" -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$atom_addr" | tr -d '"') '{"transfer":{"recipient":'$factory_contract',"amount":"100000000000"}}' -y -b block   --from "$deployer_name" -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$trst_addr" | tr -d '"') '{"transfer":{"recipient":'$factory_contract',"amount":"1000000000"}}' -y -b block   --from "$deployer_name" -b block   --gas 3000000 --fees 500utrst -y -b block
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$osmo_addr" | tr -d '"') '{"transfer":{"recipient":'$factory_contract',"amount":"1000000000"}}' -y -b block   --from "$deployer_name" -b block   --gas 3000000 --fees 500utrst -y -b block


echo Factory: "$factory_contract" | tr -d '"'
echo Router: "$router_contract" | tr -d '"'
echo Keyring: "$keyring_contract" | tr -d '"'

echo ETH: "$eth_addr" | tr -d '"'
echo TRST: "$trst_addr" | tr -d '"'
echo ATOM: "$atom_addr" | tr -d '"'
echo OSMO: "$osmo_addr" | tr -d '"'



echo Pairs:
docker exec localtrst-localtrst-1 trstd q compute query $(echo "$factory_contract" | tr -d '"') '{"pairs":{}}' | jq -c .pairs


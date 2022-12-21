#!/bin/bash

set -xe


function wait_for_tx() {
    until ( docker exec localtrst-localtrst-1 trstd q tx "$1"); do
        sleep 5
    done
}


export deployer_name=b
export deployer_address=$( trstd keys show -a $deployer_name --keyring-backend test)
echo "Deployer address: '$deployer_address'"

export test_address=trust16rpg3wwxsrggxv34hj2ca5xa2gxy4jgs3teh0n
export test_name_2=c
export test_address_2=$( trstd keys show -a $test_name_2 --keyring-backend test)

export chain_id=trstdev-1
export wasm_path=./build
export iter=3
trstd config node http://localhost:26657
trstd config broadcast-mode block

trstd tx compute store "${wasm_path}/keyring.wasm" --from "$deployer_name" --keyring-backend test --chain-id "$chain_id" --gas 4000000 --fees 500utrst --output json -y --duration 0 --interval 0 --contract-title ''$iter' Keyring' --contract-description 'Keyring Contract. Allows you to access multiple tokens and NFTs using just one key. Contract code available at github.com/trstlabs/'
keyring_code_id=$( trstd query compute list-codes | jq '.[-1]."id"')
keyring_code_hash=$( trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored token: '$keyring_code_id', '$keyring_code_hash'"


trstd tx compute store "${wasm_path}/tip20.wasm" --from "$deployer_name" --keyring-backend test --chain-id "$chain_id" --gas 4000000 --fees 500utrst -b block -y --duration 0 --interval 0 --contract-title 'TIP20 Token HackWasm' --contract-description 'CosmWasm Representative Token (Privacy-first & on-chain). This contract code is used for TrustlessContract-based tokens and TrustlessContract-based versions of public tokens (e.g. ATOM/JUNO/OSMO/TRST). Similar in functionality to ERC20, CW20,SNIP20. Contract code available at github.com/trstlabs/'
token_code_id=$( trstd query compute list-codes | jq '.[-1]."id"')
token_code_hash=$( trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored token: '$token_code_id', '$token_code_hash'"


trstd tx compute store "${wasm_path}/recurring_send_multi_ibc.wasm" --from "$deployer_name" --keyring-backend test --chain-id "$chain_id" --gas 3000000 --fees 500utrst -b block -y --contract-title 'Recurring Send Multi IBC' --contract-description 'This contract code is for sending recurring transactions to multiple addresses, even over IBC, with only 1-click. It is an extention to TIP20 contract code. Contract code available at github.com/trstlabs/' --duration 1000s --interval 20s
recurring_send_ibc_code_id=$( trstd query compute list-codes | jq '.[-1]."id"')
recurring_send_ibc_code_hash=$( trstd query compute list-codes | jq '.[-1]."code_hash"')
echo "Stored recurring send code: '$recurring_send_ibc_code_id', '$recurring_send_ibc_code_hash'"


echo "Deploying Keyring..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $keyring_code_id '{"prng_seed":"YWE="}' --contract_id Keyring"$iter" --from $deployer_name --keyring-backend test --chain-id "$chain_id" --gas 3000000 --fees 700utrst -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

keyring_contract=$( docker exec localtrst-localtrst-1 trstd query compute list-contracts-by-code $keyring_code_id | jq '.[-1].address')
echo "Keyring address: '$keyring_contract'"


echo "Deploying TIP20..."

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute instantiate $token_code_id '{"admin": "'$deployer_address'", "symbol": "PETH", "decimals": 18, "initial_balances": [], "prng_seed": "YWE=", "name": "test","config":{"public_total_supply":true,"enable_deposit":true,"enable_redeem":true,"enable_mint":true,"enable_burn":true}, "native_symbol": "utrst", "keyring": {"contract": '$keyring_contract', "code_hash":'$keyring_code_hash'}}' --from $deployer_name --keyring-backend test --chain-id "$chain_id" --gas 3000000 --fees 500utrst --gas 1500000 --contract_id "'$iter'fake pETH" -b block -y |
    jq -r .txhash
)
wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

token_addr=$( docker exec localtrst-localtrst-1 trstd query compute list-contracts-by-code $token_code_id | jq '.[-1].address')
echo "ETH address: '$token_addr'"

export TX_HASH=$(
    docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$token_addr" | tr -d '"') '{"deposit": {}}' --from $deployer_name --keyring-backend test --chain-id "$chain_id" --gas 3000000 --fees 500utrst --amount 100000000utrst --gas 1500000 -b block -y |
    jq -r .txhash
)

wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

echo "Deploying a recurring contract instance..."


msg='{"owner": "'$deployer_address'","recipient_info":[{"recipient":"'$test_address'","recurrence_amount":"1000000","channel_id":"channel-0"},{"recipient":"'$test_address_2'","recurrence_amount":"10000","memo":"asdfasdg"}],"token_code_hash":'$token_code_hash', "timeout":"15", "keyring": {"contract": '$keyring_contract', "code_hash":'$keyring_code_hash'}}'
msg_to_pass="$(base64 --wrap=0 <<<"$msg")"

auto_msg='{"auto_msg":{}}'
auto_msg_to_pass="$(base64 --wrap=0 <<<"$auto_msg")"

export TX_HASH=$( docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$token_addr" | tr -d '"') '{"instantiate_with_allowance" : { "max_allowance": "10000000", "code_id":'$recurring_send_ibc_code_id', "code_hash":'$recurring_send_ibc_code_hash', "duration":"2000s","msg":"'$msg_to_pass'", "auto_msg":"'$auto_msg_to_pass'", "interval":"40s", "contract_id":"'$iter'RecurringSendMultiIBC"}}' -b block -y --amount 400000000utrst --from $deployer_name --keyring-backend test --chain-id "$chain_id" --gas 3000000 --fees 500utrst -y -b block |
    jq -r .txhash
)

wait_for_tx "$TX_HASH" "Waiting for tx to finish on-chain..."
docker exec localtrst-localtrst-1 trstd q compute tx $TX_HASH

export recurring_send_ibc_contract=$( docker exec localtrst-localtrst-1 trstd query compute list-contracts-by-code $recurring_send_ibc_code_id | jq '.[-1].address')



docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$keyring_contract" | tr -d '"') '{"set_viewing_key":{"key":"my_key"}}' -y --output json --from "$deployer_name" --keyring-backend test --chain-id "$chain_id" --output json --gas 3000000 --fees 500utrst -y --output json
docker exec localtrst-localtrst-1 trstd tx compute execute $(echo "$keyring_contract" | tr -d '"') '{"set_viewing_key":{"key":"my_key"}}' -y --output json --from "$test_address_2" --keyring-backend test --chain-id "$chain_id" --output json --gas 3000000 --fees 500utrst -y --output json

echo RecurringSendMultiIBC: "$recurring_send_ibc_contract" | tr -d '"'


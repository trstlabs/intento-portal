# Trustless Hub IBC setup

Two local Trustless Hub chains can communicate with each other via a Hermes relayer

## Build

```bash
docker build -f hermes.Dockerfile . --tag hermes:test
```

### Run

```bash
docker compose up
```

### Verify IBC transfers

Assuming you have a key 'a' which is not the relayer's key,
from localhost:

```bash
a_mnemonic="grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar"

echo $a_mnemonic | trstcli keys add a --recover

trstcli add-genesis-account "$(trstcli keys show -a a)" 1000000000000000000utrst

# be on the source network (trstdev-1)
trstcli config node http://localhost:26657

# check the initial balance of a
trstcli q bank balances trust1q6k0w4cejawpkzxgqhvs4m2v6uvdzm6j2pk2jx

# transfer to the destination network
trstcli tx ibc-transfer transfer transfer channel-0 trust1he7t2wxzpmfuxfrw7qjg52vu4qljq3l56w5qqw 2utrst --from a

# check a's balance after transfer
trstcli q bank balances trust1q6k0w4cejawpkzxgqhvs4m2v6uvdzm6j2pk2jx

# switch to the destination network (trstdev-2)
trstcli config node http://localhost:36657

# check that you have an ibc-denom
trstcli q bank balances trust1ykql5ktedxkpjszj5trzu8f5dxajvgv95nuwjx # should have 1 ibc denom
```

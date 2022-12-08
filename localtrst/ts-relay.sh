# first setup docker+hermes relayer. Once that is running you can use the ts-relayer to relay messages that use the wasm port.

ibc-setup init --src trstdev-1  --dest trstdev-2

ibc-setup ics20 -v

ibc-relayer start -v --poll 15
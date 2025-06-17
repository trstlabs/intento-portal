## Intento Portal interface

Interface to build transactions and workflows on-chain. 

- Dashboard for Flows
- Autocompound INTO tokens
- Advanced automation for scheduling flows using (self-)hosted interchain accounts
- Send tokens on a recurring basis


Run the app in dev mode locally.

```bash
npm run dev
# or
yarn dev
```

Access the app on `http://localhost:3000/`.

## Configuration

The app configuration, feature flags, etc., is located in the .env config file.

To configure the app, you will need to swap the demo example configuration set with your chain information and add your tokens and ibc assets information.

Configure RPC and rest endpoints in public/chain_info.local.json and IBC info in public/ibc_assets.json.


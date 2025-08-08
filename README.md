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

### Environment Variables

The app uses environment variables for configuration. Copy the example environment file and update it with your values:

```bash
cp scripts/example.env .env.local
# Edit .env.local with your configuration
```

### IBC Assets Configuration

The IBC assets configuration is now generated from environment variables during the build process. The configuration is generated from the `.env.local` file when you run `npm run build` or `npm run generate:ibc-assets`.

### Manual Configuration (Legacy)

If you need to manually configure the app, you can still edit the following files directly:
- `public/chain_info.local.json` - RPC and REST endpoints
- `public/ibc_assets.json` - IBC assets information (will be overwritten on build)

However, it's recommended to use environment variables as described above for better maintainability and security.


## TriggerPortal interface

Interface to build transactions and workflows on-chain. 
Using Trustless Triggers and Trustless Contracts through the TrustlessJS library. 

### Features
- Dashboard for Triggers
- Autocompound INTO tokens
- Advanced automation for scheduling transactions with interchain accounts
- Send tokens on a recurring basis

Based on Junoblocks and Wasmswap interface, an open-source interface for a CosmWasm decentralized exchange.

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

### Provide IBC assets configuration

By default, the platform only renders the example IBC assets. To allow for interchain asset transfers you will need to provide your ibc tokens lists. Refer to the ibc asset configuration [example](https://github.com/Wasmswap/wasmswap-interface/blob/develop/public/ibc_assets.json) for more information.

Similarly to `NEXT_PUBLIC_CHAIN_INFO_URL` & `NEXT_PUBLIC_TOKEN_LIST_URL` variables, the config will be loaded dynamically.

```
Local

NEXT_PUBLIC_IBC_ASSETS_URL=/ibc_assets.json
```

```
Url

NEXT_PUBLIC_IBC_ASSETS_URL=https://raw.githubusercontent.com/Wasmswap/asset-list-example/main/ibc_assets.json
```

## Branding configuration

### App name

By default, the app uses the `Wasmswap` name. To update the app name, go to the `.env` file and change the following variable:

```
NEXT_PUBLIC_SITE_TITLE=Wasmswap
```

That will change the site title and update the footer.

### Demo mode

By default, the app renders demo mode warning to warn the users that the app runs in a demo/simulation mode. If you'd like to disable the demo mode, update this env variable:

```
NEXT_PUBLIC_TEST_MODE_DISABLED=false
```

### App version

Update this variable if you choose to run a different version.

```
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Branding

We rcommend vector graphics for your project's logo and name. Go to `/icons/Logo.tsx` and swap our branded logo symbol with yours to update the app logo.

Go to `/icons/LogoText.tsx` and update the file accordingly to update the logo text.

### Color palette

To update the color palette, go to `components/theme.ts` and provide your custom values.

### Typography and buttons

#### Font

To swap the font, navigate to `components/theme.ts` and update the font family tokens. Don't forget to connect your fonts. Refer to `styles/globals.scss` for an example.

#### Color palette

Update your project colors in the same file by updating the color tokens, and values for `textColors`, `iconColors`, `backgroundColors`, `borderColors`. It's important to keep color tokens in one space as we're planning on supporting dark & sepia modes in the future.

#### Buttons

To update the styling for buttons go to `components/Button.tsx` and provide your custom styling for the variants we use.

#### Typography

To update the typography component configuration, go to `components/Text.tsx` and provide your custom styling for our variants.

## How to deploy

This is a nextjs app; thus everything that a nextjs app supports for deployment technically is supported by `wasmswap-interface`. We would recommend looking into Vercel.

## Contributing

Raise the bar for Web 3.0 with us! We would love you to contribute. Submit your PR contributions and issues directly on this repo.

## License

Wasmswap interface is licensed under Apache 2.0.

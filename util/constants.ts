export const AUTOTX_REFETCH_INTERVAL = 6000 //6s
export const DEFAULT_LONG_REFETCH_INTERVAL = 30000 //30s
export const DEFAULT_REFETCH_INTERVAL = 15000
export const DEFAULT_REFETCH_ON_WINDOW_FOCUS_STALE_TIME = 60000 // 1 minute
// export const SLIPPAGE_OPTIONS = [0.01, 0.02, 0.03, 0.05]
// export const NETWORK_FEE = 0.003
// export const GAS_PRICE = process.env.NEXT_PUBLIC_GAS_PRICE

export const APP_NAME = process.env.NEXT_PUBLIC_SITE_TITLE
export const APP_MAX_WIDTH = '1920px'

export const MAIN_PANE_MAX_WIDTH = '1080px'

/* the app operates in test mode */
export const __TEST_MODE__ = !JSON.parse(
  process.env.NEXT_PUBLIC_TEST_MODE_DISABLED
)

export const __TRANSFERS_ENABLED__ = JSON.parse(
  process.env.NEXT_PUBLIC_ENABLE_FEATURE_TRANSFERS
)

/* /feature flags */

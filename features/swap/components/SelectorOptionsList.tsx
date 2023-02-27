import { TokenSelectList, TokenSelectListProps } from 'components'
import { useTokenList } from 'hooks/useTokenList'

export const TokenOptionsList = ({
  activeTokenSymbol,
  onSelect,
  ...props
}: Omit<TokenSelectListProps, 'tokenList' | 'fetchingBalanceMode'>) => {
  const [tokenList] = useTokenList()
  return (
    <TokenSelectList
      {...props}
      tokenList={tokenList.tokens}
      activeTokenSymbol={activeTokenSymbol}
      onSelect={onSelect}
      fetchingBalanceMode="native"
    />
  )
}
import { TokenInfo } from '../../../queries/usePoolsListQuery'
export const DexOptionsList = ({
  activeTokenSymbol,
  onSelect,
  ...props
}: Omit<TokenSelectListProps, 'tokenList' | 'fetchingBalanceMode'>) => {
  const dexList = useDexList()

  return (
    <TokenSelectList
      {...props}
      tokenList={dexList}
      activeTokenSymbol={activeTokenSymbol}
      onSelect={onSelect}
      fetchingBalanceMode="native"
    />
  )
}


export const useDexList = () => {
  //test input
  let trstDex: TokenInfo = {
    id: 'Trustless Hub',
    chain_id: 'trstdev-1',
    symbol: 'Trustless Hub',
    name: 'Trustless Hub',
    logoURI: "https://www.trustlesshub.com/img/brand/icon.png",
    decimals: 6,
    token_address: '',
    denom: '',
    native: true,
  }
  let osmoDex: TokenInfo = {
    id: 'Osmosis',
    chain_id: 'osmosis-1',
    symbol: 'Osmosis',
    name: 'Osmosis',
    logoURI: "https://app.osmosis.zone/_next/image?url=%2Ftokens%2Fosmo.svg&w=128&q=75",
    decimals: 6,
    token_address: '',
    denom: '',
    native: true,
    channel: 'channel-5'
  }
  let junoDex: TokenInfo = {
    id: 'JunoSwap',
    chain_id: 'uni-1',
    symbol: 'JunoSwap',
    name: 'Juno',
    logoURI: "https://1347255254-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FkIBcvuSNFl67qnhKwSqU%2Fuploads%2FTNoZ3iET0TeAW0AnTq7V%2FJunoSwap%20Logo%20.svg?alt=media&token=a87f21d3-6aac-4221-97f1-dfb99e5d4fcc",
    decimals: 6,
    token_address: '',
    denom: '',
    native: true,
    channel: 'channel-5'
  }

  const dexToTokenArray: TokenInfo[] = [trstDex, osmoDex, junoDex]
  return dexToTokenArray
}
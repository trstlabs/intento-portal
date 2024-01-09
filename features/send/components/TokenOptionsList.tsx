import { TokenSelectList, TokenSelectListProps } from 'components'
import { useIBCAssetList } from '../../../hooks/useChainList'

export const TokenOptionsList = ({
  activeTokenSymbol,
  onSelect,
  ...props
}: Omit<TokenSelectListProps, 'tokenList' | 'fetchingBalanceMode'>) => {
  const [tokenList] = useIBCAssetList()
  return (
    <TokenSelectList
      {...props}
      tokenList={tokenList}
      activeTokenSymbol={activeTokenSymbol}
      onSelect={onSelect}
      fetchingBalanceMode="native"
    />
  )
}

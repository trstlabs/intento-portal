import { TokenSelectList, TokenSelectListProps } from 'components'
import { useIBCAssetList } from '../../../hooks/useIBCAssetList'

export const TokenOptionsList = ({
  activeTokenSymbol,
  onSelect,
  ...props
}: Omit<TokenSelectListProps, 'tokenList' | 'fetchingBalanceMode'>) => {
  const [tokenList] = useIBCAssetList()
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

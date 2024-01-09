import { TokenSelectList } from 'components'
import { useIBCAssetList } from '../../../../hooks/useChainList'

export const TokenOptionsList = ({
  activeTokenSymbol,
  onSelect,
  fetchingBalanceMode,
  ...props
}) => {
  const [tokenList] = useIBCAssetList()
  return (
    <TokenSelectList
      {...props}
      tokenList={tokenList}
      activeTokenSymbol={activeTokenSymbol}
      onSelect={onSelect}
      visibleNumberOfTokensInViewport={2.5}
      fetchingBalanceMode={fetchingBalanceMode}
    />
  )
}

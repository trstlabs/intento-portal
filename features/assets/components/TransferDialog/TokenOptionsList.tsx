import { useIBCAssetList } from '../../../../hooks/useChainList'
import { TokenSelectList } from '../../../send/components/TokenSelectList'

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

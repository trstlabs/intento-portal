import { useTokenInfo } from 'hooks/useTokenInfo'
import {
    Button,
    ErrorIcon,
    formatSdkErrorMessage,
    IconWrapper,
    Toast,
    UpRightArrow,
    Valid,
} from 'junoblocks'
import { toast } from 'react-hot-toast'
import { useMutation } from 'react-query'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { AutoExecData} from '../../../services/send'
import {
    TransactionStatus,
    transactionStatusState,
} from 'state/atoms/transactionAtoms'
import { walletState, WalletStatusType } from 'state/atoms/walletAtoms'
import { convertDenomToMicroDenom } from 'util/conversion'
import { useTokenToTokenPrice } from './useTokenToTokenPrice'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { executeCostAverage } from '../../../services/swap/executeCostAverage'
import { slippageAtom } from '../swapAtoms'
import { particleState } from '../../../state/atoms/particlesAtoms'

type UseCostAveragingArgs = {
    tokenASymbol: string
    tokenBSymbol: string
    /* token amount in denom */
    tokenAmount: number
    autoExecData: AutoExecData
}

export const useCostAveraging = ({
    tokenASymbol,
    tokenBSymbol,
    tokenAmount: providedTokenAmount,
    autoExecData,
}: UseCostAveragingArgs) => {
    const { client, address, status } = useRecoilValue(walletState)
    const setTransactionState = useSetRecoilState(transactionStatusState)
    const slippage = useRecoilValue(slippageAtom)
    const [_, popConfetti] = useRecoilState(particleState)
    
    const tokenA = useTokenInfo(tokenASymbol)
    const tokenB = useTokenInfo(tokenBSymbol)
    const refetchQueries = useRefetchQueries(['tokenBalance'])

    const [tokenToTokenPrice] = useTokenToTokenPrice({
        tokenASymbol,
        tokenBSymbol,
        tokenAmount: providedTokenAmount,
    })

    return useMutation(
        'costAverage',
        async () => {
            if (status !== WalletStatusType.connected) {
                throw new Error('Please connect your wallet.')
            }

            setTransactionState(TransactionStatus.EXECUTING)
            const tokenAmount = convertDenomToMicroDenom(
                providedTokenAmount,
                tokenA.decimals
            )

            autoExecData.funds = convertDenomToMicroDenom(
                autoExecData.funds,
                6
            )

            const price = convertDenomToMicroDenom(
                tokenToTokenPrice.price,
                tokenB.decimals
            )

            const {
                poolForDirectTokenAToTokenBSwap,
                poolForDirectTokenBToTokenASwap,
            } = tokenToTokenPrice
            console.log(poolForDirectTokenAToTokenBSwap)
            console.log(tokenToTokenPrice)
            if (poolForDirectTokenAToTokenBSwap || poolForDirectTokenBToTokenASwap) {
                const swapDirection = poolForDirectTokenAToTokenBSwap?.swap_address
                    ? 'tokenAtoTokenB'
                    : 'tokenBtoTokenA'
                const swapAddress =
                    poolForDirectTokenAToTokenBSwap?.swap_address ??
                    poolForDirectTokenBToTokenASwap?.swap_address
                console.log(address)

                return await executeCostAverage({
                    tokenAmount,
                    price,
                    slippage,
                    senderAddress: address,
                    swapAddress,
                    swapDirection,
                    tokenA,
                    client,
                    autoExecData,
                })
            }
        },
        {
            onSuccess(data) {
                console.log(data)
                let contractAddress = data.arrayLog.find(
                    (log) =>
                        log.key == "contract_address"
                ).value;
                console.log(contractAddress)
                toast.custom((t) => (
                    <Toast
                        icon={<IconWrapper icon={<Valid />} color="primary" />}
                        title="Cost Averaging started successfully!"
                        body={`Started to cost average into ${tokenB.symbol} !} Your personal contract is ${contractAddress}`}
                        buttons={
                            <Button
                                as="a"
                                variant="ghost"
                                href={`/contracts/${contractAddress}`}
                                target="__blank"
                                iconRight={<UpRightArrow />}
                            >
                                Go to your contract
                            </Button>
                        }
                        onClose={() => toast.dismiss(t.id)}
                    />
                ))
                popConfetti(true)
                setTimeout( () => popConfetti(false), 3000)
                refetchQueries()
            },
            onError(e) {
                const errorMessage = formatSdkErrorMessage(e)

                toast.custom((t) => (
                    <Toast
                        icon={<ErrorIcon color="error" />}
                        title="Oops error cost averaging!"
                        body={errorMessage}
                        buttons={
                            <Button
                                as="a"
                                variant="ghost"
                                href={process.env.NEXT_PUBLIC_FEEDBACK_LINK}
                                target="__blank"
                                iconRight={<UpRightArrow />}
                            >
                                Provide feedback
                            </Button>
                        }
                        onClose={() => toast.dismiss(t.id)}
                    />
                ))
            },
            onSettled() {
                setTransactionState(TransactionStatus.IDLE)
            },
        }
    )
}

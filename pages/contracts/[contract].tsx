import { AppLayout, NavigationSidebar } from 'components'
import {
  ContractInfoBreakdown, TokenInfoCard, RecurringSendCard

} from 'features/contracts'
import {
  Button,
  ChevronIcon,
  Column,
  Inline,
  Spinner,
  styled,
  Text,
  useMedia,
} from 'junoblocks'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import {
  // __POOL_REWARDS_ENABLED__,
  // __POOL_STAKING_ENABLED__,
  APP_NAME,
} from 'util/constants'
import { useContractInfo } from '../../hooks/useContractInfo'

export default function Contract() {
  const {
    query: { contract },
  } = useRouter()

  // const [
  //   { isShowing: isManageLiquidityDialogShowing, actionType },
  //   setManageLiquidityDialogState,
  // ] = useState({ isShowing: false, actionType: 'add' as 'add' | 'remove' })

  // const [isBondingDialogShowing, setIsBondingDialogShowing] = useState(false)

  const isMobile = useMedia('sm')
  // const [contract, isLoading, isError] = useQueryContractLiquidity({ contractId })

  // const [pendingRewards] = usePendingRewards({
  //   contract,
  // })

  //let contractInfo
  //let isLoading = true
  //if (contract) {
  const [contractInfo, isLoading] = useContractInfo(contract)

  //}


  // const supportsIncentives = Boolean(
  //   __POOL_STAKING_ENABLED__ &&
  //     __POOL_REWARDS_ENABLED__ &&
  //     contract?.staking_address
  // )

  // const refetchQueries = useRefetchQueries(['@liquidity', 'pendingRewards'])

  // const { mutate: mutateClaimRewards,  contract: contract, } =
  // useClaimRewards({
  //   contract,
  //   onSuccess() {
  //     refetchQueries()

  //     toast.custom((t) => (
  //       <Toast
  //         icon={<IconWrapper icon={<Valid />} color="valid" />}
  //         title="Rewards were successfully claimed!"
  //         onClose={() => toast.dismiss(t.id)}
  //       />
  //     ))
  //   },
  //   onError(e) {
  //     console.error(e)

  //     toast.custom((t) => (
  //       <Toast
  //         icon={<IconWrapper icon={<Error />} color="error" />}
  //         title={"Couldn't claim your rewards"}
  //         body={formatSdkErrorMessage(e)}
  //         buttons={
  //           <Button
  //             as="a"
  //             variant="ghost"
  //             href={process.env.NEXT_PUBLIC_FEEDBACK_LINK}
  //             target="__blank"
  //             iconRight={<UpRightArrow />}
  //           >
  //             Provide feedback
  //           </Button>
  //         }
  //         onClose={() => toast.dismiss(t.id)}
  //       />
  //     ))
  //   },
  // })


  if (!contractInfo && !contract) {
    return (

      <Inline
        align="center"
        justifyContent="center"
        css={{ padding: '$10', height: '100vh' }}> <title>
          Contract
        </title>
        {isLoading ? (
          <Text variant="header">
            {"Oops, we've messed up. Please try again later."}
          </Text>
        ) : (
          <Spinner color="primary" />
        )}
      </Inline>
    )
  }


  return (
    <>

      <AppLayout
        navigationSidebar={
          <NavigationSidebar
            shouldRenderBackButton={isMobile}
            backButton={
              <Link href="/contracts" passHref>
                <Button as="a" variant="ghost" icon={<ChevronIcon />} />
              </Link>
            }
          />
        }>

        {APP_NAME && contractInfo != undefined && (
          <Head>
            <title>
              {APP_NAME} — Contract {contractInfo.contractId}
            </title>
          </Head>
        )}

        {isLoading && (
          <StyledDivForSpinner>
            <Spinner color="primary" size={32} />
          </StyledDivForSpinner>
        )}



        {!isLoading && contractInfo && (
          <>
            <ContractInfoBreakdown
              contractInfo={contractInfo}
              contract={contract}
              size={isMobile ? 'small' : 'large'}
            />

            {contractInfo.codeId == process.env.NEXT_PUBLIC_TIP20_CODE_ID && (<Column css={{ flexBasis: '0px', flexGrow: 1, flexShrink: 1 }}>
              <TokenInfoCard
                contractAddress={contract}
                contractInfo={contractInfo}
              />
            </Column>)}
            {contractInfo.codeId == process.env.NEXT_PUBLIC_RECURRINGSEND_CODE_ID && (<Column css={{ flexBasis: '0px', flexGrow: 1, flexShrink: 1 }}>
              <RecurringSendCard
                contractAddress={contract}
                contractInfo={contractInfo}
              />
            </Column>)}

          </>
        )}
      </AppLayout>
    </>
  )
}

const StyledDivForSpinner = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 143,
})

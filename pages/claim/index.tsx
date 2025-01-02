import { AppLayout, NavigationSidebar } from 'components'

import {
    Button,
    ChevronIcon,
    Spinner,
    styled,
    useMedia,
    Text,
    Inline,
} from 'junoblocks'
import Head from 'next/head'
import Link from 'next/link'

import React, { useState } from 'react'
import { APP_NAME } from 'util/constants'

import { useClaimRecord, useClaimRecordForAddress, useTotalClaimable } from '../../hooks/useClaimRecord'
import ClaimAirdrop from '../../features/claim/components/claim'
import ViewAirdropEligibility from '../../features/claim/components/eligibility'

export default function Claim() {
    const isMobile = useMedia('sm')

    const [address, setAddress] = useState("")
    const [claimRecord, isLoading] = useClaimRecord()
    /*  const [claimRecord, isLoading] = useClaimRecordForAddress(address) */
    const [total, isTotalLoading] = useTotalClaimable()
    if (isLoading) {
        return (
            <AppLayout
                navigationSidebar={
                    <NavigationSidebar
                        shouldRenderBackButton={isMobile}
                        backButton={
                            <Link href="#" passHref>
                                <Button as="a" variant="ghost" icon={<ChevronIcon />} />
                            </Link>
                        }
                    />
                }
            >
                {' '}
                <title>Claim</title>
                <StyledDiv>
                    <Spinner color="primary" size={32} />
                </StyledDiv>
            </AppLayout>
        )
    }

    return (
        <>
            <AppLayout
                navigationSidebar={
                    <NavigationSidebar
                        shouldRenderBackButton={isMobile}
                        backButton={
                            <Link href="#" passHref>
                                <Button as="a" variant="ghost" icon={<ChevronIcon />} />
                            </Link>
                        }
                    />
                }
            >
                {APP_NAME && claimRecord != "" && (
                    <Head>
                        <title>
                            {APP_NAME} — Airdrop
                        </title>
                    </Head>
                )}


                {claimRecord == "" && (
                    <StyledDiv>
                        <Text variant="legend">
                            <>Claiming currently not available for connected address. </>
                        </Text>{' '}
                        {/* <Text variant="legend">
                            <StyledInput
                                placeholder="into1.. stars1... cosmos1...ƒ"
                                type="text"
                                value={address}
                                onChange={({ target: { value } }) =>
                                    setAddress(value)
                                }
                            />

                        </Text> */}

                    </StyledDiv>

                )}
                {claimRecord != "" && !claimRecord &&
                    <StyledDiv>
                        <Text variant="legend">
                            <>Connect an address to view your eligibility. </>
                        </Text>{' '}
                    </StyledDiv>

                }

                {claimRecord && total && (
                    process.env.NEXT_PUBLIC_CLAIM_ENABLED == "true" ?
                        <>
                            <ClaimAirdrop claimRecord={claimRecord} claimRecordLoaded={!isLoading && !isTotalLoading} total={Number(total)} />
                        </> :
                        <>
                            <ViewAirdropEligibility claimRecord={claimRecord} claimRecordLoaded={!isLoading && !isTotalLoading} total={Number(total)} />
                        </>
                )
                }



            </AppLayout>
        </>
    )
}

const StyledDiv = styled('div', {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 143,
})


const StyledInput = styled('input', {
    width: '100%',
    color: 'inherit',
    padding: '$2',
    margin: '$2',
})

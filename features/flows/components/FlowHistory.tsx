import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Column,
  Inline,
  Text,
  Spinner,
  Card,
} from 'junoblocks'

import React from 'react'

import { GlobalDecoderRegistry } from 'intentojs'
import { convertMicroDenomToDenom, formatDenom } from 'util/conversion'
import { useFlowHistory } from '../../../hooks/useFlow'
import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { getRelativeTime } from '../../../util/time'

import { __TEST_MODE__ } from '../../../util/constants'
import { FlowHistoryEntry } from 'intentojs/dist/codegen/intento/intent/v1/flow'
import { Link } from '@interchain-ui/react'



type FlowHistoryProps = {
  id: string
  transformedMsgs?: string[]
}

export const FlowHistory = ({
  id,
  transformedMsgs
}: FlowHistoryProps) => {




  const [flowHistory, setFlowHistory] = useState<FlowHistoryEntry[]>([]);
  const [historyLimit] = useState(5);
  const [fetchNext, setFetchNext] = useState(false);
  const [paginationKey, setPaginationKey] = useState(undefined);
  const [fetchedHistory, isHistoryLoading] = useFlowHistory(id.toString(), historyLimit, paginationKey);
  const refetchQueries = useRefetchQueries([`flowHistory/${id.toString()}/${paginationKey}`], 15);


  // Clear flowHistory when id changes
  useEffect(() => {
    if (paginationKey == undefined) {
      setFlowHistory([]);
    }
  }, [fetchedHistory]);


  const uniqueFetchedHistory = useMemo(() => {
    if (fetchedHistory && fetchedHistory.history && fetchedHistory.history.length > 0) {
      const existingIds = new Set(flowHistory.map(entry => entry.scheduledExecTime));
      //console.log('Existing IDs:', existingIds);

      const uniqueEntries = fetchedHistory.history.filter(entry => !existingIds.has(entry.scheduledExecTime));
      //console.log('Filtered Unique Entries:', uniqueEntries);

      return uniqueEntries;
    }
    return [];
  }, [fetchedHistory, flowHistory]);

  useEffect(() => {
    if (uniqueFetchedHistory.length > 0) {
      console.log('Unique Fetched History:', uniqueFetchedHistory);
      setFlowHistory(prevHistory => {
        const combinedHistory = [...prevHistory, ...uniqueFetchedHistory];
        const uniqueCombinedHistory = combinedHistory.reduce((acc, current) => {
          const x = acc.find(item => item.scheduledExecTime === current.scheduledExecTime); // Ensure this 'id' is unique and reliable
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);
        //console.log('Combined History Before Removing Duplicates:', combinedHistory);
        //console.log('Combined History After Removing Duplicates:', uniqueCombinedHistory);

        return uniqueCombinedHistory;
      });
    }
  }, [uniqueFetchedHistory]);

  //  fetching next page
  const fetchNextPage = () => {
    setFetchNext(prev => !prev)
    const nextKey = fetchedHistory.pagination?.nextKey;
    setPaginationKey(nextKey);
    refetchQueries()
    setFetchNext(prev => !prev)

  };

  return (

    <>
      {flowHistory && flowHistory.length > 0 && (

        <Row>
          <Column gap={8} align="flex-start" justifyContent="flex-start">
            <Inline>

              <Text variant="title" align="left" style={{ marginBottom: '10px', fontWeight: '600' }}>
                Execution History
              </Text>
            </Inline>
            {flowHistory
              ?.slice(0).filter((entry, index, self) => self.findIndex(e => e.scheduledExecTime === entry.scheduledExecTime) === index)
              .map(
                (
                  {
                    execFee,
                    actualExecTime,
                    msgResponses,
                    executed,
                    errors,
                    timedOut,
                    queryResponses,
                    packetSequences
                  },
                  index
                ) => (

                  <div key={index}>
                    <Column
                      gap={2}
                      align="flex-start"
                      justifyContent="flex-start"
                    >
                      <Column>
                        <Text variant="body">
                          At {getRelativeTime(actualExecTime.getTime())}{' '}
                        </Text>
                      </Column>
                      {/*  {actualExecTime.getSeconds() -
                            scheduledExecTime.getSeconds() >=
                            5 && (
                            <Column>
                              <Text variant="caption">
                                Actual send time was{' '}
                                {actualExecTime.getSeconds() -
                                  scheduledExecTime.getSeconds()}{' '}
                                seconds later than scheduled
                              </Text>
                            </Column>
                          )} */}
                      {execFee && execFee.length > 0 && execFee.map((fee) => (
                        <Column>
                          <Text variant="caption">
                            Exec Fee:{' '}
                            {convertMicroDenomToDenom(fee.amount, 6)} {formatDenom(fee.denom)}
                          </Text>
                        </Column>
                      ))}

                      <Column>
                        {packetSequences != undefined && <Text variant="caption"> Packet Sequences: {packetSequences != undefined && packetSequences.length > 0 && packetSequences.map((packetSequence, i) => (
                          <Link key={i} href={process.env.NEXT_PUBLIC_INTO_RPC + `/tx_search?query="acknowledge_packet.packet_sequence=${packetSequence}"`} target="_blank">
                            {Number(packetSequence)}
                            {i < packetSequences.length - 1 && <span>, </span>}
                          </Link>

                        ))}</Text>}

                        {queryResponses.map((queryResponse) => (
                          <Column>
                            <Text variant="caption">
                              Query Response:  {queryResponse}
                            </Text>
                          </Column>
                        ))}
                      </Column>


                      <Column>
                        <Text variant="caption">
                          Executed: {executed  ? <>🟢</> :
                            (Date.now() - actualExecTime.valueOf() >
                              60000 && !timedOut ? (
                                <>🔴</>
                              ) || errors[0] : (timedOut ?
                                <>⏱️</> : <>⌛</>
                            ))}
                        </Text>

                        {errors.map((err, _) => {
                          // Check for AuthZ permission errors
                          const isAuthZError = err.includes('error handling packet on host chain') &&
                            (err.includes('ABCI code: 2:'));
                          const isWasmError = err.includes('error handling packet on host chain') && transformedMsgs?.find((msg) => msg.includes('.wasm.')) &&
                            (err.includes('ABCI code: 5:'));

                          <Column>
                            <Text variant="legend" style={{ paddingTop: '4px' }}>
                              {isAuthZError ? 'AuthZ permission lacking' : isWasmError ? 'CosmWasm contract did not execute with a succesfull result' : err}
                            </Text>

                          </Column>

                        })}
                        {timedOut && (
                          <Text variant="legend">
                            Timed out relaying IBC packets for this execution
                          </Text>
                        )}
                      </Column>
                      {msgResponses.map((msg: any, i) => (
                        <div key={i}>
                          <Card css={{ padding: '$6', marginTop: '$4' }}>
                            <Column gap={8} align="flex-start" justifyContent="flex-start">
                              <Text variant="legend" color="secondary" align="left">
                                Message Response
                              </Text>
                              <Text variant="caption" >{msg.typeUrl} ✓ </Text>

                              {msg.value.length != 0 && (
                                <>
                                  <Text variant="legend" color="secondary" align="left">
                                    Message Response Value
                                  </Text>
                                  <Text variant="caption">
                                    {JSON.stringify(GlobalDecoderRegistry.unwrapAny(msg), (_key, value) =>
                                      typeof value === 'bigint'
                                        ? value.toString()
                                        : value // return everything else unchanged
                                      , 2)}
                                  </Text>
                                </>
                              )}
                            </Column>
                          </Card>

                        </div>))}
                    </Column>


                  </div>
                )
              )}
            {fetchedHistory && fetchedHistory.pagination && fetchedHistory.pagination.nextKey.length > 1 && (<Button onClick={fetchNextPage} variant="ghost" size="large"> {fetchNext || isHistoryLoading ? <Spinner instant /> : <>View more</>}</Button>)}
          </Column>
        </Row>

      )}

    </>

  )
}

function Row({ children }) {
  const baseCss = { padding: '$10 $10' }
  return (
    <Inline
      css={{
        ...baseCss,
        margin: '$4',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '$light',
        borderRadius: '18px',
        border: '1px solid $borderColors$default',
        backgroundColor: '$base',
      }}
    >
      {children}
    </Inline>
  )
}


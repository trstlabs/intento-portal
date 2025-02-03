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
import { convertMicroDenomToDenom } from 'util/conversion'
import { useFlowHistory } from '../../../hooks/useFlowInfo'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { getRelativeTime } from '../../../util/time'


type FlowHistoryProps = {
  id: string
}

export const FlowHistory = ({
  id,
}: //size = 'large',
  FlowHistoryProps) => {

  const [flowHistory, setFlowHistory] = useState([]);
  const [historyLimit] = useState(5); // Define your historyLimit or make it dynamic as needed
  const [fetchNext, setFetchNext] = useState(false);
  const [paginationKey, setPaginationKey] = useState(undefined);
  const [fetchedHistory, isHistoryLoading] = useFlowHistory(id.toString(), historyLimit, paginationKey);
  const refetchQueries = useRefetchQueries([`flowHistory/${id.toString()}/${paginationKey}`], 15);

  // Clear flowHistory when id changes
  useEffect(() => {
    if (paginationKey == undefined) {
      setFlowHistory([]);
      // setPaginationKey(undefined);
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
        <>
          {' '}
          <Row>
            {' '}
            <Column gap={8} align="flex-start" justifyContent="flex-start">
              {' '}
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
                      queryResponses

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
                        <Column>
                          <Text variant="legend">
                            Exec Fee:{' '}
                            {convertMicroDenomToDenom(execFee.amount, 6)} INTO
                          </Text>
                        </Column>

                        <Column>

                          {queryResponses.map((queryResponse) => (
                            <Column>
                              <Text variant="legend">
                                Query Response:  {queryResponse}
                              </Text>
                            </Column>
                          ))}
                        </Column>

                        {errors.map((err, _) => (
                          <Column>
                            <Text variant="legend">
                              🔴 {err}
                            </Text>
                          </Column>
                        ))}

                        <Column>
                          <Text variant="legend">
                            Executed: {executed && <>🟢</>}{' '}
                            {!executed &&
                              (Date.now() - actualExecTime.valueOf() >
                                60000 && !timedOut ? (
                                  <>🔴</>
                                ) || errors[0] : (timedOut ?
                                  <>⏱️</> : <>⌛</>
                              ))}
                          </Text>

                          {timedOut && (
                            <Text variant="legend">
                              Execution on the destination chain did not
                              happen because it timed out
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

                                {msg.value.length != 0 &&
                                  <>
                                    <Text variant="legend" color="secondary" align="left">
                                      Message Response Value
                                    </Text>
                                    <Text variant="caption"> {JSON.stringify(GlobalDecoderRegistry.unwrapAny(msg), null, 2)}</Text>
                                  </>
                                }
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
        </>
      )}

    </>

  )
}

function Row({ children }) {
  const baseCss = { padding: '$10 $16' }
  return (
    <Inline
      css={{
        ...baseCss,
        margin: '$6',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
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


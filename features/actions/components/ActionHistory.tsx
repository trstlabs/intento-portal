import { useEffect, useState } from 'react'
import {
  Button,
  Column,
  Inline,
  Text,
  Spinner,
} from 'junoblocks'

import React from 'react'


import { convertMicroDenomToDenom } from 'util/conversion'


import { useActionHistory } from '../../../hooks/useActionInfo'

import { useRefetchQueries } from '../../../hooks/useRefetchQueries'
import { getRelativeTime } from '../../../util/time'


type ActionHistoryProps = {
  id: string
}

export const ActionHistory = ({
  id,
}: //size = 'large',
  ActionHistoryProps) => {

  const [actionHistory, setActionHistory] = useState([]);
  const [historyLimit] = useState(5); // Define your historyLimit or make it dynamic as needed
  const [fetchNext, setFetchNext] = useState(false);
  const [paginationKey, setPaginationKey] = useState(undefined);
  const [fetchedHistory, isHistoryLoading] = useActionHistory(id.toString(), historyLimit, paginationKey);
  const refetchQueries = useRefetchQueries([`actionHistory/${id.toString()}/${paginationKey}`], 15);

  useEffect(() => {

    if (fetchedHistory && fetchedHistory.history && fetchedHistory.history.length > 0 && !actionHistory.find(entry => entry == fetchedHistory.history[0])) {
      if (actionHistory.length == 0 || !actionHistory.includes(fetchedHistory.history[0])) {
        // Append new entries to the existing history
        setActionHistory(prevHistory => [...prevHistory, ...fetchedHistory.history]);
      }
    }
  }, [fetchedHistory]);

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
      {actionHistory && actionHistory.length > 0 && (
        <>
          {' '}
          <Row>
            {' '}
            <Column gap={8} align="flex-start" justifyContent="flex-start">
              {' '}
              <Inline>
                <Text variant="legend" color="secondary" align="left">
                  Execution History
                </Text>
              </Inline>
              {actionHistory
                ?.slice(0)
                .map(
                  (
                    {
                      execFee,
                      actualExecTime,

                      executed,
                      errors,
                      timedOut,
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

                        {errors.map((err, _) => (
                          <Column>
                            {/*    <span key={'b' + ei}> */}
                            <Text variant="legend">
                              🔴 Execution error: {err}
                            </Text>

                            {/*    </span> */}
                          </Column>
                        ))}

                        <Column>
                          <Text variant="legend">
                            Executed: {executed && <>🟢</>}{' '}
                            {!executed &&
                              (Date.now() - actualExecTime.valueOf() >
                                3000000 ? (
                                  <>🔴</>
                                ) || errors[0] : (
                                <>⌛</>
                              ))}
                          </Text>

                          {timedOut && (
                            <Text variant="legend">
                              Execution on the destination chain did not
                              happen because it timed out
                            </Text>
                          )}
                        </Column>
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


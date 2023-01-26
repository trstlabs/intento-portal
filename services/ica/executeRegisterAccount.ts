
import {
  TrustlessChainClient,
} from 'trustlessjs'
import { useICAForUser } from '../../hooks/useICA'

import {

  validateTransactionSuccess,
} from '../../util/messages'
import { getICA } from './data'

type ExecuteRegisterAccountArgs = {
  owner: string
  connectionId: string
  client: TrustlessChainClient
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export const executeRegisterAccount = async ({
  client,
  connectionId,
  owner,
}: ExecuteRegisterAccountArgs): Promise<any> => {
  let tx = await client.tx.autoibctx.register_account({
    connectionId, owner,
  },
    { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
  )
  validateTransactionSuccess(tx)
  await sleep(20000)
  let acc = await getICA({ owner, connectionId, client })
  if (acc != "") {
    return acc
  }
  await sleep(20000)
  acc = await getICA({ owner, connectionId, client })
  if (acc != "") {
    return acc
  }
  await sleep(15000)
  acc = await getICA({ owner, connectionId, client })
  if (acc != "") {
    return acc
  }
  await sleep(5000)
  acc = await getICA({ owner, connectionId, client })
  if (acc != "") {
    return acc
  }
  await sleep(5000)
  acc = await getICA({ owner, connectionId, client })
  if (acc != "") {
    return acc
  }
  return undefined
}


import {
  TrustlessChainClient,
} from 'trustlessjs'
import {
  validateTransactionSuccess,
} from '../../util/messages'


type ExecuteRegisterAccountArgs = {
  owner: string
  connectionId: string
  client: TrustlessChainClient
}


export const executeRegisterAccount = async ({
  client,
  connectionId,
  owner,
}: ExecuteRegisterAccountArgs): Promise<any> => {
  let tx = await client.tx.autoTx.registerAccount({
    connectionId, owner,
  },
    { gasLimit: Number(process.env.NEXT_PUBLIC_GAS_LIMIT_MORE) }
  )
  validateTransactionSuccess(tx)
 
}

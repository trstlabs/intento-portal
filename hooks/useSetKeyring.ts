import {
  // createWasmAminoConverters,
  TrustlessChainClient,
  TxResultCode
} from 'trustlessjs'



export const useSetKeyring = async (
  address: string,
  client: TrustlessChainClient,
) => {
  //const { address, client } = useRecoilValue(walletState)
  if (!client){
    console.log("sadgfsadf")
  }
  try {

    let vk = localStorage.getItem("vk" + address);
    if (vk != undefined) {
      try {
        await client.query.compute.queryContractPrivateState({ contractAddress: process.env.NEXT_PUBLIC_KEYRING_ADDR, codeHash: process.env.NEXT_PUBLIC_KEYRING_CODE_HASH, query: { balance: { key: vk, address: address } } })
      } catch (e) {
        console.log(e)
        localStorage.removeItem("vk" + address)
        alert("Setting viewing key failed")
      }
    } else {
      vk = prompt(
        `Please specify a viewing key for this address to continue.`
      )

      let resp = await client.tx.compute.executeContract({
        sender: address,
        contract: process.env.NEXT_PUBLIC_KEYRING_ADDR,
        codeHash: process.env.NEXT_PUBLIC_KEYRING_CODE_HASH,
        msg: {
          set_viewing_key: {
            key: vk,
          },
        },

      }, {
        gasLimit: 150_000
      })
      console.log(resp)
      if (resp.code !== TxResultCode.Success) {
        console.error(resp.rawLog);
        alert("Setting viewing key failed")
       

      }
      localStorage.setItem("vk" + address, vk);
      location.reload()
    }

  } catch (e) {
    console.log("Error setting keyring")
    /* throw the error for the UI */
    throw e
  }


}

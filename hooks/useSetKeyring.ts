export {}
// import { useRecoilValue } from 'recoil';
// import {

//   TxResultCode
// } from 'trustlessjs'
// import { walletState } from '../state/atoms/walletAtoms';



// export const setKeyring = async () => {
//   const { address, client } = useRecoilValue(walletState)
//   if (!client) {
//     console.log("sadgfsadf")
//   }
//   try {

//     let vk = localStorage.getItem("vk" + address);
//     if (vk != undefined) {
//       try {
//         await client.query.compute.queryContractPrivateState({ contractAddress: process.env.NEXT_PUBLIC_KEYRING_ADDR, codeHash: process.env.NEXT_PUBLIC_KEYRING_CODE_HASH, query: { balance: { key: vk, address: address } } })
//       } catch (e) {
//         console.log(e)
//         localStorage.removeItem("vk" + address)
//         alert("Setting viewing key failed")
//       }
//     } else {
//       vk = prompt(
//         `Please specify a viewing key for this address to continue.`
//       )
//       console.log(process.env.NEXT_PUBLIC_GAS_LIMIT_MEDIUM)
//       let resp = await client.tx.compute.executeContract({
//         sender: address,
//         contract: process.env.NEXT_PUBLIC_KEYRING_ADDR,
//         codeHash: process.env.NEXT_PUBLIC_KEYRING_CODE_HASH,
//         msg: {
//           set_viewing_key: {
//             key: vk,
//           },
//         },

//       }, {
//         gasLimit: +process.env.NEXT_PUBLIC_GAS_LIMIT_MEDIUM
//       })
//       console.log(resp)
//       if (resp.code !== TxResultCode.Success) {
//         console.error(resp.rawLog);
//         alert("Broadcasting viewing key failed");
//         return;
//       };
//       localStorage.setItem("vk" + address, vk);
//       location.reload()
//     }

//   } catch (e) {
//     console.log("Error setting keyring")
//     /* throw the error for the UI */
//     throw e
//   }


// }

import { TrustlessChainClient } from 'trustlessjs'


type TrustlessChainClients = {
  [rpcEndpoint: string]: TrustlessChainClient
}


class TrustlessChainClientRouter {
  clients: TrustlessChainClients = {}

  async connect(rpcEndpoint, chainId) {
    if (!this.getClientInstance(rpcEndpoint)) {
      let client = await TrustlessChainClient.create({
        grpcWebUrl: rpcEndpoint,
        chainId,
      })
      this.setClientInstance(rpcEndpoint, client)

     
    }
    return this.getClientInstance(rpcEndpoint)
  }

  getClientInstance(rpcEndpoint) {
    return this.clients[rpcEndpoint]
  }
  setClientInstance(rpcEndpoint, client) {
    this.clients[rpcEndpoint] = client
  }
}

export const trustlessChainClientRouter = new TrustlessChainClientRouter()


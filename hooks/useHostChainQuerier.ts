import { createProtobufRpcClient, QueryClient } from "@cosmjs/stargate";
import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
/* import { AuthzQuerier } from "trustlessjs";

// Inside an async function...
// The Tendermint client knows how to talk to the Tendermint RPC endpoint
const tendermintClient = await Tendermint34Client.connect("my.endpoint.com");

// The generic Stargate query client knows how to use the Tendermint client to submit unverified ABCI queries
const queryClient = new QueryClient(tendermintClient);

// This helper function wraps the generic Stargate query client for use by the specific generated query client
const rpcClient = createProtobufRpcClient(queryClient);

// Here we instantiate a specific query client which will have the custom methods defined in the .proto file
const queryService = new AuthzQuerier(rpcClient);

// Now you can use this service to submit queries
const queryResult = await queryService.MyCustomQuery({
  foo: "bar",
});

/ Define your extensions
function setupXxxExtension(base: QueryClient) {
  const rpcClient = createProtobufRpcClient(base);
  const queryService = new QueryClientImpl(rpcClient);

  return {
    mymodule: {
      customQuery: async (foo: string) =>
        queryService.MyCustomQuery({ foo: foo }),
    },
  };
}
function setupYyyExtension(base: QueryClient) {
  // ...
}

// Setup the query client
const queryClient = QueryClient.withExtensions(
  tendermintClient,
  setupXxxExtension,
  setupYyyExtension,
  // You can add up to 18 extensions
);

// Inside an async function...
// Now your query client has been extended
const queryResult = await queryClient.mymodule.customQuery("bar"); */
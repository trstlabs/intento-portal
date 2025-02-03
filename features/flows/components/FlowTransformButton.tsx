import { FlowInfo } from 'intentojs/dist/codegen/intento/intent/v1beta1/flow';
import { useRouter } from 'next/router';
import { FlowInput } from '../../../types/trstTypes';
import { Button, CopyIcon } from 'junoblocks';
import { fetchFlowMsgs } from '../../../hooks/useGetMsgsFromAPI';


export const FlowTransformButton = ({ flowInfo }) => {
    const router = useRouter();

    const convertBigIntToString = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(convertBigIntToString);
        }
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
                if (typeof value === 'bigint') {
                    return [key, value.toString()];
                }
                return [key, convertBigIntToString(value)];
            })
        );
    };


    const transformFlowInfo = async (info: FlowInfo) => {


        const msgs = await transformFlowMsgs(info)
        console.log(msgs)
        // Transform FlowInfo to FlowInput
        const flowInput: FlowInput = {
            // Your transformation logic here
            duration: info.endTime.getMilliseconds() - info.startTime.getMilliseconds(),
            msgs: msgs,
            conditions: info.conditions,
            configuration: info.configuration,
            connectionId: info.icaConfig.connectionId,
            hostConnectionId: info.icaConfig.hostConnectionId,
            hostedConfig: info.hostedConfig,
            label: info.label

        };
        console.log(flowInput)
        return flowInput;

    };

    const handleClick = async () => {
        let flowInput = await transformFlowInfo(flowInfo);
        flowInput = convertBigIntToString(flowInput);
        router.push({
            pathname: '/build',
            query: { flowInput: JSON.stringify(flowInput) }
        });
    };

    return <Button variant="secondary" iconRight={<CopyIcon />} onClick={handleClick}>Copy and Create</Button>;
};

///temporary solution as typeUrls get lost in retrieving from intentojs/telescope as the objects are unwrapped there with the GlobalRegistry. We cannnot transpile without that setting becasue then we loose the full registry  needed to unwrap/wrap ourselves and  osmosis.gamm.v1beta1.load(registry) is unavailable without the useGlobalDecoderRegistry setting
async function transformFlowMsgs(info) {
            // let msgs: string[] = []
        // info.msgs.forEach((msgAny: any, index) => {
        //     // console.log(msgAny.valueDecoded)
        //     // let msgObj = GlobalDecoderRegistry.unwrapAny(msgAny);

        //     // console.log(msgObj)
        //     if (msgAny.typeUrl == '/cosmos.authz.v1beta1.MsgExec') {
        //         // msgAny.valueDecoded.msgs.forEach((msgExecAny: any, indexExec) => {
        //         //     let registry = GlobalDecoderRegistry;

        //         //     const filteredEntries = Object.keys(GlobalDecoderRegistry.registry)
        //         //         .filter(key => key.includes("Msg"))
        //         //         .reduce((acc, key) => {
        //         //             acc[key] = GlobalDecoderRegistry.registry[key];
        //         //             return acc;
        //         //         }, {} as { [key: string]: TelescopeGeneratedCodec<any, any, any> });

        //         //     registry.registry = filteredEntries;

        //         //     const wrappedMsg = registry.wrapAny(msgExecAny)
        //         //     // console.log(wrappedMsg)
        //         //     const msgValue = msgAny.valueDecoded.msgs[indexExec]
        //         //     // console.log(msgValue)
        //         //     msgAny.valueDecoded.msgs[indexExec] = {}
        //         //     msgAny.valueDecoded.msgs[indexExec].value = msgValue
        //         //     msgAny.valueDecoded.msgs[indexExec].typeUrl = wrappedMsg.typeUrl

        //         // })
        //         msgAny.valueDecoded = await fetchFlowMsgs(info.id.toString())
        //     }
        //     console.log(msgAny.valueDecoded)

        //     const msgObj = { typeUrl: msgAny.typeUrl, value: msgAny.valueDecoded }
        //     const msg = JSON.stringify(msgObj, null, 2)
        //     msgs[index] = msg
        //     console.log(msgs)
        // });
    let msgs: string[] = []
    if (info.msgs[0].typeUrl === '/cosmos.authz.v1beta1.MsgExec') {
        const msgsObj = await fetchFlowMsgs(info.id.toString());
        msgsObj.forEach((msgObj: any, index) => {
            const msg = JSON.stringify(msgObj, (key, value) =>
                typeof value === "bigint" ? value.toString() : value,
                2
              );
            msgs[index] = msg
        })
    } else {
        info.msgs.forEach((msgAny: any, index) => {
            console.log(msgAny.valueDecoded)

            const msgObj = { typeUrl: msgAny.typeUrl, value: msgAny.valueDecoded }
            const msg = JSON.stringify(msgObj, (key, value) =>
                typeof value === "bigint" ? value.toString() : value,
                2
              );
            msgs[index] = msg
            console.log(msgs)
        })
    }

    console.log(msgs); // All messages have been processed
    return msgs;
}

export default FlowTransformButton;


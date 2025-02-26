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

                // // Special handling to avoid wrapping amount/denom objects
                // if (typeof value === 'object' && value !== null && 'denom' in value && 'amount' in value) {
                //     return [key, { denom: String(value.denom), amount: String(value.amount) }];
                // }

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
export async function transformFlowMsgs(info) {
    let msgs: string[] = []

    if (info.msgs[0].typeUrl === '/cosmos.authz.v1beta1.MsgExec') {
        const msgsObj = await fetchFlowMsgs(info.id.toString());

        msgsObj.forEach((msgObj: any, index) => {
            console.log("Before normalization:", JSON.stringify(msgObj, null, 2));

            msgObj = normalizeAmountField(msgObj); // 🔹 Fix amount field here

            console.log("After normalization:", JSON.stringify(msgObj, null, 2));

            const msg = JSON.stringify(msgObj, (_, value) =>
                typeof value === "bigint" ? value.toString() : value,
                2
            );

            console.log("After transformation:", msg);
            msgs[index] = msg;
        });

    } else {
        info.msgs.forEach((msgAny: any, index) => {
            //console.log("Original MsgAny:", JSON.stringify(msgAny.valueDecoded, null, 2));

            let msgObj = { typeUrl: msgAny.typeUrl, value: msgAny.valueDecoded };

            // msgObj = normalizeAmountField(msgObj); // 🔹 Fix amount field here

            // console.log("After normalization:", JSON.stringify(msgObj, null, 2));

            const msg = JSON.stringify(msgObj, (_, value) =>
                typeof value === "bigint" ? value.toString() : value,
                2
            );

            console.log("Transformed Msg:", msg);
            msgs[index] = msg;
        });
    }

    console.log("Final processed messages:", msgs);
    return msgs;
}
//patch for the workaround
const normalizeAmountField = (obj: any) => {
    if (!obj || typeof obj !== "object") return obj;

    if (Array.isArray(obj)) {
        return obj.map(normalizeAmountField);
    }

    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => {
            // Fix 'amount' field when it's an array with a 'value' field
            if (key === "amount" && Array.isArray(value)) {
                return [
                    key,
                    value.map((entry: any) => entry.value ? entry.value : entry), // Cast entry to `any`
                ];
            }

            // Fix 'delegation.amount' or similar structures
            if (key === "amount" && typeof value === "object" && value !== null) {
                // Cast value to `any` to avoid TypeScript error
                const valueAsAny = value as any;

                if (valueAsAny.value && typeof valueAsAny.value === "object") {
                    return [
                        key,
                        {
                            denom: valueAsAny.value.denom || valueAsAny.value?.denom,
                            amount: valueAsAny.value.amount || valueAsAny.amount,
                        },
                    ];
                }
            }

            // Recursively apply normalization for nested objects
            return [key, normalizeAmountField(value)];
        })
    );
};

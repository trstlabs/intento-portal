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
            hostedIcaConfig: info.hostedIcaConfig,
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

export async function transformFlowMsgs(info) {
    let msgs: string[] = [];

    const msgsObj = await fetchFlowMsgs(info.id.toString());

    msgsObj.forEach((msgObj: any, index) => {
        console.log("Before normalization:", JSON.stringify(msgObj, null, 2));

        msgObj = normalizeAmountField(msgObj); // 🔹 Fix amount field here
        console.log( msgObj["typeUrl"]?.includes("MsgExecuteContract") &&
        typeof msgObj.value.msg === "string")
        // 🔹 Decode MsgExecuteContract inner msg if applicable
        if (
            msgObj["typeUrl"]?.includes("MsgExecuteContract")
        ) {
            try {
                const decodedMsg = JSON.parse(
                    Buffer.from(msgObj.value.msg, "base64").toString("utf-8")
                );
                msgObj.value.msg = decodedMsg;
                console.log("Decoded MsgExecuteContract msg:", decodedMsg);
            } catch (e) {
                console.warn("Failed to decode MsgExecuteContract msg:", e);
            }
        }

        console.log("After normalization & decoding:", JSON.stringify(msgObj, null, 2));

        const msg = JSON.stringify(
            msgObj,
            (_, value) => (typeof value === "bigint" ? value.toString() : value),
            2
        );

        console.log("After transformation:", msg);
        msgs[index] = msg;
    });

    console.log("Final processed messages:", msgs);
    return msgs;
}

const normalizeAmountField = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;

    // Handle arrays recursively
    if (Array.isArray(obj)) {
        return obj.map(normalizeAmountField);
    }

    // If this object has a `value` key containing denom + amount, unwrap it
    if (
        "value" in obj &&
        typeof obj.value === "object" &&
        obj.value !== null &&
        "amount" in obj.value &&
        "denom" in obj.value
    ) {
        return {
            denom: obj.value.denom,
            amount: obj.value.amount,
        };
    }

    // Recurse through the object
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, normalizeAmountField(value)])
    );
};

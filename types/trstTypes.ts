import { Any } from "cosmjs-types/google/protobuf/any";
import { Coin } from '@cosmjs/stargate'
import { Timestamp } from "trustlessjs/dist/codegen/google/protobuf/timestamp";
import { Duration } from "trustlessjs/dist/codegen/google/protobuf/duration";

export interface MsgUpdateAutoTxParams {
    owner: string;
    txId: number,
    connectionId?: string;
    msgs?: Any[];
    endTime?: number;
    label?: string;
    interval?: string;
    startAt?: number;
    feeFunds?: Coin[];
    dependsOnTxIds?: number[];
    version?: string;
  }


/** AutoTxInfo stores the info for the auto executing interchain accounts transaction */
export interface AutoTxInfo {
    txId: string;
    owner: string;
    label: string;
    feeAddress: string;
    msgs: Any[];
    interval?: Duration;
    startTime?: Timestamp;
    execTime?: Timestamp;
    endTime?: Timestamp;
    autoTxHistory: AutoTxHistoryEntry[];
    portId: string;
    connectionId: string;
    /** optional array of dependent txs that should be executed before execution is allowed */
    dependsOnTxIds: string[];
    updateHistory: Timestamp[];
  }
  

/** AutoTxHistoryEntry provides a the history of AutoTx interchain tx call */
export interface AutoTxHistoryEntry {
    scheduledExecTime?: Timestamp;
    actualExecTime?: Timestamp;
    execFee?: Coin;
    executed: boolean;
    timedOut: boolean;
    /** uint64 retries = 6; */
    error: string;
  }
import { Address } from "viem";

export type UserOp = {
  preDecodedCallData: string;
  userOpHash: string;
  sender: Address;
  blockNumber: string;
  success: "0" | "1";
  input: string;
};

export type JiffyscanTxItem = {
  hash: string;
  from: string;
  to: string;
  blockNumber: string;
  methodId?: string; // For Etherscan's transaction data
  timeStamp?: string;
  isError?: string; // This might be specific to Etherscan
  input?: string; // For Alchemy's transaction data
};

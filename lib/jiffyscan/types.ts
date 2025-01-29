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

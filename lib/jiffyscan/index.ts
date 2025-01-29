import { Address } from "viem";
import { JiffyscanTxItem } from "./types";
import { ADDRESS_ACTIVITY_QUERY, extractMethodIdAndContractAddress, getDataFromGraph, retryOperation } from "./utils";

export async function getJiffyscanTransactions(address: Address): Promise<JiffyscanTxItem[]> {
  const graphApiKey = process.env.GRAPH_API_KEY;
  if (!graphApiKey) {
    throw new Error("Graph API key not found");
  }
  try {
    const allUserOps: JiffyscanTxItem[] = [];
    let skip = 0;
    while (true) {
      const response = await retryOperation(() => getDataFromGraph(ADDRESS_ACTIVITY_QUERY, { address, first: 1000, skip }, graphApiKey));
      if (!response?.userOps?.length) break;
      allUserOps.push(
        ...response.userOps.map((op) => {
          const { methodId, contractAddress } = extractMethodIdAndContractAddress(op.callData);
          return {
            hash: op.userOpHash,
            from: op.sender,
            to: contractAddress || "",
            blockNumber: op.blockNumber,
            methodId: methodId,
            isError: op.success ? "0" : "1",
            input: op.input,
          };
        }),
      );
      if (response.userOps.length < 1000) break;
      skip += 1000;
    }
    return allUserOps;
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return [];
  }
}

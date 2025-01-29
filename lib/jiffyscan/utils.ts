import { Address, createPublicClient, http } from "viem";
import { base } from "viem/chains";

interface GraphResponse {
  userOps: Array<{
    sender: string;
    target: string;
    success: boolean;
    blockNumber: string;
    userOpHash: string;
    input: string;
    callData: string;
  }>;
}

interface GraphQLResponse {
  data: GraphResponse;
  errors?: any[];
}

export async function getDataFromGraph(
  query: string,
  variables: any,
  graphApiKey: string,
): Promise<GraphResponse> {
  const GRAPH_ENDPOINT = "https://gateway-arbitrum.network.thegraph.com/api/{API_KEY}/subgraphs/id/9KToKxWC5uRS5ecCFgAxrScDPU2rVMy3hp7abAkt6BED"
  const response = await fetch(GRAPH_ENDPOINT.replace("{API_KEY}", graphApiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }
  const json = (await response.json()) as GraphQLResponse;
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
};

export const ADDRESS_ACTIVITY_QUERY = `
  query AddressActivityQuery($address: Bytes, $first: Int, $skip: Int) {
    userOps(first: $first, skip: $skip, orderBy: blockTime, orderDirection: desc, where: { or: [{ sender: $address }, { target: $address }] }) {
      sender
      target
      success
      blockNumber
      userOpHash
      input
      callData
    }
  }
`;

export async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

export function extractMethodIdAndContractAddress(preDecodedCallData: string): {
  methodId: string;
  contractAddress: string;
} {
  if (!preDecodedCallData || !preDecodedCallData.startsWith("0x")) {
    return { methodId: "0x", contractAddress: "" };
  }

  try {
    // Contract address is at fixed position (226-266)
    const contractAddress = "0x" + preDecodedCallData.slice(226, 266);
    // Method ID is at position 458 (8 characters)
    // Check if we have enough data
    if (preDecodedCallData.length >= 466) {
      const methodId = "0x" + preDecodedCallData.slice(458, 466);
      return { methodId, contractAddress };
    }
    return { methodId: "0x", contractAddress };
  } catch (error) {
    console.error("Error extracting data:", error);
    return { methodId: "0x", contractAddress: "" };
  }
};

const client = createPublicClient({ chain: base, transport: http(process.env.RPC_BASE) });

export async function isContractAddress(address: Address): Promise<boolean> {
  try {
    const code = await client.getCode({ address });
    return code !== undefined && code !== "0x";
  } catch (error) {
    console.error("Error checking contract address:", {
      address,
      error: error instanceof Error ? error.message : String(error),
      fullError: error,
      clientState: { exists: !!client, methods: client ? Object.keys(client) : [] },
    });
    return false;
  }
}

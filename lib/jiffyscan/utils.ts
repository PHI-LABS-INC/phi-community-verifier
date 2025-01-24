import { Address, createPublicClient, http } from "viem";
import { base } from "viem/chains";

export function extractMethodIdAndContractAddress(preDecodedCallData: string): {
  methodId: string;
  contractAddress: string;
} {
  if (!preDecodedCallData || !preDecodedCallData.startsWith('0x')) {
    return { methodId: '0x', contractAddress: "" };
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
    const code = await client.getCode({
      address,
    });
    //check code length and undefined
    if (code === undefined) {
      return false;
    }
    return code !== "0x";
  } catch (error) {
    console.error("Error checking contract address:", {
      address,
      error: error instanceof Error ? error.message : String(error),
      fullError: error,
      clientState: {
        exists: !!client,
        methods: client ? Object.keys(client) : [],
      },
    });
    return false;
  }
}

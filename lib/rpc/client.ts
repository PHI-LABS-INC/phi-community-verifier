import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export const client = createPublicClient({
  chain: base,
  transport: http(process.env.RPC_BASE)
});

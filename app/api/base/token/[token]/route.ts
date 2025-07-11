import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { createSignature } from "@/lib/signature";
import { client } from "@/lib/rpc/client";

const ABI = [{
  "inputs": [{ "name": "account", "type": "address" }],
  "name": "balanceOf",
  "outputs": [{ "name": "", "type": "uint256" }],
  "stateMutability": "view",
  "type": "function"
}] as const;

export async function GET(req: NextRequest, { params: { token } }: { params: { token: string } }) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return new Response("Invalid address",{ status: 400 });
    }
    if (!token || !isAddress(token)) {
      return new Response("Invalid token",{ status: 400 });
    }

    const balance = await client.readContract({
      address: token,
      abi: ABI,
      functionName: "balanceOf",
      args: [address],
    });
    const mint_eligibility = balance > BigInt(0);
    const signature = await createSignature({ address, mint_eligibility });

    return Response.json({ signature, mint_eligibility }, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}

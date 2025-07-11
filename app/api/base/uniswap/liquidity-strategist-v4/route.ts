import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { createSignature } from "@/lib/signature";
import { client } from "@/lib/rpc/client";

const PositionManager = "0x7C5f5A4bBd8fD63184577525326123B519429bDc";
const ABI = [  {
  "inputs": [
    {
      "internalType": "address",
      "name": "owner",
      "type": "address"
    }
  ],
  "name": "balanceOf",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
},] as const;

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return new Response("Invalid address",{ status: 400 });
    }
    const threshold = req.nextUrl.searchParams.get("threshold") || "1";

    const balance = await client.readContract({
      address: PositionManager,
      abi: ABI,
      functionName: "balanceOf",
      args: [address],
    });
    const mint_eligibility = balance >= BigInt(threshold);
    const data = balance.toString();
    const signature = await createSignature({ address, mint_eligibility, data });

    return Response.json({ signature, mint_eligibility, data }, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}



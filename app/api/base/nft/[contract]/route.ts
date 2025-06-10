import { NextRequest } from "next/server";
import { Address, isAddress } from "viem";
import { createSignature } from "@/lib/signature";
import { client } from "@/lib/rpc/client";

const ERC721_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ERC1155_ABI = [
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function GET(
  req: NextRequest,
  { params: { contract } }: { params: { contract: Address } }
) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return new Response("Invalid address", { status: 400 });
    }
    const tokenId = req.nextUrl.searchParams.get("tokenId");

    let balance;
    if (tokenId) {
      balance = await client.readContract({
        address: contract,
        abi: ERC1155_ABI,
        functionName: "balanceOf",
        args: [address, BigInt(tokenId)],
      });
    } else {
      balance = await client.readContract({
        address: contract,
        abi: ERC721_ABI,
        functionName: "balanceOf",
        args: [address],
      });
    }

    const mint_eligibility = balance > BigInt(0);
    const signature = await createSignature({ address, mint_eligibility });

    return Response.json({ signature, mint_eligibility }, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}

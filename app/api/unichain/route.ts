import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { createSignature } from "@/lib/signature";
import { getTransactions } from "@/lib/etherscan";
import { unichain } from "viem/chains";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return new Response("Invalid address", { status: 400 });
    }
    console.log({ address});

    const txs = await getTransactions(address, unichain.id);
    console.log(`Fetched ${txs.length} transactions for address: ${address}`);

    const mint_eligibility = txs.length >= 1;
    const signature = await createSignature({ address, mint_eligibility });

    return Response.json({ signature, mint_eligibility }, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}

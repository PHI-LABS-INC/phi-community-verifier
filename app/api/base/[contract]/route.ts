import { NextRequest } from "next/server";
import { Address, isAddress } from "viem";
import { createSignature } from "@/lib/signature";
import { getTransactions } from "@/lib/etherscan";
import { getJiffyscanTransactions } from "@/lib/jiffyscan";
import { isContractAddress } from "@/lib/jiffyscan/utils";

export async function GET(req: NextRequest, { params: { contract } }: { params: { contract: Address } }) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return new Response("Invalid address", { status: 400 });
    }
    const methodIds = req.nextUrl.searchParams.getAll("methodId");
    const threshold = parseInt(req.nextUrl.searchParams.get("threshold") || "1");
    console.log({ address, contract, methodIds, threshold });

    const txs = await isContractAddress(address) ? await getJiffyscanTransactions(address) : await getTransactions(address);
    console.log(`Fetched ${txs.length} transactions for address: ${address}`);
    const verifiedTxs = txs.filter((tx) => {
      if (tx.to.toLowerCase() !== contract.toLowerCase()) {
        return false;
      }
      if (methodIds.length === 0) {
        return true;
      }
      return methodIds.some((id) => tx.methodId?.toLowerCase() === id.toLowerCase())
    });

    const mint_eligibility = verifiedTxs.length >= threshold;
    const signature = await createSignature({ address, mint_eligibility });

    return Response.json({ signature, mint_eligibility }, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}

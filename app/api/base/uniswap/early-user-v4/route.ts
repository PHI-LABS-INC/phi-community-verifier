import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { createSignature } from "@/lib/signature";
import { getTransactions } from "@/lib/etherscan";
import { isContractAddress } from "@/lib/jiffyscan/utils";
import { getJiffyscanTransactions } from "@/lib/jiffyscan";

// contract deploy: https://basescan.org/tx/0x0efe6f4f59683fd326dcefe5c07f7b072740ae02fcbe81dbc1755e4aba5fe1f2
// Jan-21-2025 08:29:05 PM +UTC)
// announcement on X: https://x.com/Uniswap/status/1885329579495080248
// 10:09 PM · Jan 31, 2025

const universalRouter = "0x6ff5693b99212da76ad316178a184ab56d299b43";

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return new Response("Invalid address", { status: 400 });
    }
    console.log({ address});

    const txs = await isContractAddress(address) ? await getJiffyscanTransactions(address) : await getTransactions(address);
    console.log(`Fetched ${txs.length} transactions for address: ${address}`);

    const verifiedTxs = txs.filter((tx) => {
      const isSwapTx = tx.to?.toLowerCase() === universalRouter.toLowerCase();
      const isValid = Number(tx.blockNumber) <= Number(26998909); // 26998909: Feb 28-2025 11:59:26 PM (UTC), https://basescan.org/blockdateconverter
      return isSwapTx && isValid;
    })

    const mint_eligibility = verifiedTxs.length >= 1;
    const signature = await createSignature({ address, mint_eligibility });

    return Response.json({ signature, mint_eligibility }, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}

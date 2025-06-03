import { NextRequest } from "next/server";
import { isAddress } from "viem";
import { createSignature } from "@/lib/signature";
import { Address } from "viem";

const API_KEYS = [process.env.ETHERSCAN_API_KEY, process.env.ETHERSCAN_API_KEY2, process.env.ETHERSCAN_API_KEY3];

export async function GET(req: NextRequest, { params: { token } }: { params: { token: Address } }) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address || !isAddress(address)) {
      return new Response("Invalid address", { status: 400 });
    }
    if (!token || !isAddress(token)) {
      return new Response("Invalid token", { status: 400 });
    }

    const url = new URL("https://api.etherscan.io/v2/api?chainid=8453");
    const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
    url.searchParams.set("module", "account");
    url.searchParams.set("action", "tokentx");
    url.searchParams.set("contractaddress", token);
    url.searchParams.set("address", address);
    url.searchParams.set("page", "1");
    url.searchParams.set("offset", "100"); // Note; In Etherscan, "offset" is the number of transactions displayed per page.
    url.searchParams.set("sort", "asc");
    url.searchParams.set("apikey", apiKey!);
    const response = await fetch(url.toString());
    const data = await response.json();
    // if (data.status !== "1") {
    //   console.error("Etherscan API error:", data.message);
    //   return new Response("Failed to fetch transactions", { status: 500 });
    // }

    const mint_eligibility = data.result.some((tx: any) => tx.from.toLowerCase() === address.toLowerCase())
    const signature = await createSignature({ address, mint_eligibility });

    return Response.json({ signature, mint_eligibility }, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Internal server error", { status: 500 });
  }
}

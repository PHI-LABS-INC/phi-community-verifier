import { NextRequest } from "next/server";
import { Address, isAddress, createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { createSignature } from "@/lib/signature";

const client = createPublicClient({
    chain: base,
    transport: http(process.env.RPC_BASE)
});

// Contract ABIs
const ERC20_ABI = [{
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
}] as const;

export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const address = req.nextUrl.searchParams.get("address");
        const { token } = params;

        if (!address || !isAddress(address)) {
            return new Response(
                JSON.stringify({ error: "Invalid address provided" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        if (!token || !isAddress(token)) {
            return new Response(
                JSON.stringify({ error: "Invalid token address provided" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const mint_eligibility = await verifyToken(
            address as Address,
            token as Address
        );

        const signature = await createSignature({
            address: address as Address,
            mint_eligibility,
        });

        return new Response(
            JSON.stringify({ mint_eligibility, signature }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error in handler:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

/**
 * Verifies if an address holds tokens using direct contract call
 *
 * @param address - Ethereum address to check
 * @param tokenAddress - Address of the ERC20 token contract
 * @returns Boolean indicating if address holds any tokens
 * @throws Error if verification fails
 */
async function verifyToken(address: Address, tokenAddress: Address): Promise<boolean> {
    try {
        const bytecode = await client.getCode({ address: tokenAddress });
        if (bytecode === "0x") {
            throw new Error("No contract code at the provided token address.");
        }

        const balance = await client.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address],
        });

        console.log("Token balance:", balance);
        return Number(balance) > 0;
    } catch (error) {
        console.error("Error verifying token:", error);
        throw new Error("Failed to verify token balance");
    }
}
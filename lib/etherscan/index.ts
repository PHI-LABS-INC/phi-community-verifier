
import { Address, Chain } from "viem";
import { EtherscanTxItem } from "./types";

const API_KEYS = [process.env.ETHERSCAN_API_KEY, process.env.ETHERSCAN_API_KEY2, process.env.ETHERSCAN_API_KEY3];
const BASE_URL = "https://api.etherscan.io/v2/api";
const RATE_LIMIT_DELAY = 200;
const PAGE_SIZE = 10000;
const MAX_RETRIES = 5;

export async function getTransactions(address: Address, chainId: Chain["id"] = 8453): Promise<EtherscanTxItem[]> {
  let allTxs: EtherscanTxItem[] = [];
  let page = 1;
  let hasMore = true;

  const fetchTransactions = async (page: number, retries = 0) => {
    const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
    const url = `${BASE_URL}?chainId=${chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=latest&page=${page}&offset=${PAGE_SIZE}&sort=desc&apikey=${apiKey}`;

    console.log(`[etherscan] Fetching page ${page}...`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch transactions: ${res.statusText}`);
      }
      const data = await res.json() as { status: string, message: string, result: EtherscanTxItem[] };
      if (data.message === "Max calls per sec rate limit reached (5/sec)") {
        if (retries < MAX_RETRIES) {
          console.warn(`Rate limit reached. Retrying in ${RATE_LIMIT_DELAY}ms...`);
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
          return fetchTransactions(page, retries + 1);
        } else {
          throw new Error("Max retry attempts reached due to rate limit.");
        }
      }
      if (data.status !== "1" && (!data.result || data.result.length === 0)) {
        return [];
      }
      return data.result;
    } catch (error) {
      console.error(`Error fetching transactions on page ${page}:`, error);
      throw error;
    }
  };

  while (hasMore) {
    try {
      const txs = await fetchTransactions(page);
      console.log(`Fetched ${txs.length} transactions from page ${page}`);
      allTxs = allTxs.concat(txs);
      if (txs.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    } catch (error) {
      console.error("Error during transaction fetch loop:", error);
      break;
    }
  }

  return allTxs;
};

import { Address } from "viem";
import { JiffyscanTxItem, UserOp } from "./types";
import { extractMethodIdAndContractAddress } from "./utils";

const API_KEYS = [process.env.JIFFYSCAN_API_KEY, process.env.JIFFYSCAN_API_KEY2, process.env.JIFFYSCAN_API_KEY3];
const BASE_URL = "https://api.jiffyscan.xyz/v0/getAddressActivity";
const PAGE_SIZE = 10000;
const RATE_LIMIT_DELAY = 200;
const MAX_RETRIES = 5;

// https://jiffyscan.mintlify.app/api-reference/data-api-endpoint/account/get-getaddressactivity
export async function getJiffyscanTransactions(address: Address): Promise<JiffyscanTxItem[]> {
  let allTxs: JiffyscanTxItem[] = [];
  let hasMore = true;
  let skip = 0;

  const fetchTransactions = async (skip: number, retries = 0): Promise<UserOp[]> => {
    const apiKey = API_KEYS[Math.floor(Math.random() * API_KEYS.length)]!;
    const url = `${BASE_URL}?address=${address}&network=base&first=${PAGE_SIZE}&skip=${skip}`;
    try {
      const res = await fetch(url, { headers: { "x-api-key": apiKey } });
      if (!res.ok) {
        throw new Error(`Failed to fetch transactions: ${res.statusText}`);
      }
      const data = (await res.json()) as { accountDetail: { userOps: UserOp[] } };
      if (!data?.accountDetail?.userOps) {
        return [];
      }
      return data.accountDetail.userOps;
    } catch (error) {
      if (retries < MAX_RETRIES) {
        console.warn(`Retrying fetch for skip=${skip} (attempt ${retries + 1}/${MAX_RETRIES})...`);
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
        return fetchTransactions(skip, retries + 1);
      } else {
        console.error(`Max retries reached for skip=${skip}. Error:`, error);
        throw error;
      }
    }
  };

  while (hasMore) {
    try {
      const userOps = await fetchTransactions(skip);
      const mappedTxs = userOps.map((op) => {
        const { methodId, contractAddress } = extractMethodIdAndContractAddress(op.preDecodedCallData);
        return {
          hash: op.userOpHash,
          from: op.sender,
          to: contractAddress || "",
          blockNumber: op.blockNumber,
          methodId: methodId,
          isError: op.success ? "0" : "1",
        };
      });

      allTxs = allTxs.concat(mappedTxs);
      if (userOps.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        skip += PAGE_SIZE;
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    } catch (error) {
      console.error("Error during transaction fetch loop:", error);
      break;
    }
  }

  return allTxs;
}

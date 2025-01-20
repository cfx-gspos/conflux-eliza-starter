import type { Action, IAgentRuntime, Memory } from "@elizaos/core";
import {
  createWalletClient,
  http,
  parseEther,
  createPublicClient,
  getContract,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { confluxESpace } from "viem/chains";
import ERC20ABI from "../abi/erc20";
import { BigNumber, ethers } from "ethers";
import {settings} from '../settings';
import {
    createWalletClient,
    http,
    parseEther,
    parseUnits,
    type SendTransactionParameters,
} from "viem";

function generateRandomAmounts(total: number, count: number): number[] {
  const amounts: number[] = [];
  let remaining = total;

  // Generate random amounts
  for (let i = 0; i < count - 1; i++) {
    const max = remaining * 0.9; // Ensure we don't allocate too much too early
    const amount = Math.random() * max;
    amounts.push(Number(amount.toFixed(4)));
    remaining -= amount;
  }

  // Add the remaining amount as the last value
  amounts.push(Number(remaining.toFixed(4)));

  return amounts;
}

export const distributeAssets: Action = {
  name: "DISTRIBUTE_ASSETS",
  description: "Distribute CFX and ERC20 tokens to worker accounts",

  validate: async (runtime: IAgentRuntime) => {
    return true;
  },

  handler: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      // Get configuration
      const basePrivateKey = runtime.getSetting(
        "CONFLUX_ESPACE_PRIVATE_KEY"
      ) as string;
      const number = Number(
        runtime.getSetting("CONFLUX_ESPACE_PRIVATE_KEY_LIST_NUMBER") || "5"
      );
      const rpcUrl = runtime.getSetting("CONFLUX_ESPACE_RPC_URL") as string;
      const tokenAddress = runtime.getSetting("CONFLUX_MEME_COIN") as string;
      const distributeAmount = runtime.getSetting("CONFLUX_DISTRIBUTE_AMOUNT") || "1";

      // Generate worker private keys
      const privateKeyList = Array.from({ length: number }, (_, i) => {
        return basePrivateKey.slice(0, -4) + i.toString().padStart(4, "0");
      });

      // Setup clients
      const publicClient = createPublicClient({
        chain: confluxESpace,
        transport: http(rpcUrl),
      });

      const mainAccount = privateKeyToAccount(basePrivateKey as `0x${string}`);
      const mainWalletClient = createWalletClient({
        account: mainAccount,
        chain: confluxESpace,
        transport: http(rpcUrl),
      });

      const cfxBalance = await publicClient.getBalance({
        address: mainAccount.address,
      });

      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const balanceOfData =
      "0x70a08231" +
      // Address needs to be padded to 32 bytes
      mainAccount.address.slice(2).padStart(64, "0");
      const balanceERC20 = await provider.call({
        to: settings.CONFLUX_MEME_COIN,
        data: balanceOfData,
      });

      const totalCfx = Number(formatEther(cfxBalance)) - 1;
      const totalMeme = Number(formatEther(BigInt(balanceERC20))) - 1;

      const cfxAmounts = generateRandomAmounts(totalCfx, number);
      const memeAmounts = generateRandomAmounts(totalMeme, number);

      console.log('CFX Balance:', totalCfx);
      console.log('MEME Balance:', totalMeme);
      console.log('CFX Distribution:', cfxAmounts);
      console.log('MEME Distribution:', memeAmounts);

      // Distribute CFX and tokens to each worker
      for (let i = 0; i < privateKeyList.length; i++) {
        const privateKey = privateKeyList[i];
        const workerAccount = privateKeyToAccount(privateKey as `0x${string}`);

        // Distribute CFX
        const cfxTx = await mainWalletClient.sendTransaction({
          to: workerAccount.address as `0x${string}`,
          value: parseEther(cfxAmounts[i].toString()),
          type: "legacy" as const,
          kzg: undefined,
        } as unknown as SendTransactionParameters<typeof confluxESpace>);
        console.log(`Distributed ${cfxAmounts[i]} CFX to ${workerAccount.address}: ${cfxTx}`);

        // Distribute ERC20 tokens
        const transferFunctionSignature = "a9059cbb";
        const cleanTo = workerAccount.address.toLowerCase().replace("0x", "");
        const amountHex = parseUnits(memeAmounts[i].toString(), 18).toString(16).padStart(64, "0");
        const data = `0x${transferFunctionSignature}${"000000000000000000000000"}${cleanTo}${amountHex}`;

        const hash = await mainWalletClient.sendTransaction({
          to: settings.CONFLUX_MEME_COIN,
          data: data as `0x${string}`,
          type: "legacy" as const,
        } as unknown as SendTransactionParameters<typeof confluxESpace>);

        console.log("Waiting 30 seconds...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        console.log('erc20 transfer hash', hash);
        console.log(`Distributed ${memeAmounts[i]} tokens to ${workerAccount.address}: ${hash}`);
      }

      return true;
    } catch (error) {
      console.error("Asset distribution failed:", error);
      return false;
    }
  },

  examples: [
    [
      {
        user: "user1",
        content: {
          text: "Distribute assets",
          action: "DISTRIBUTE_ASSETS",
        },
      },
      {
        user: "assistant",
        content: {
          text: "Assets distributed successfully!",
        },
      },
    ],
  ],
};

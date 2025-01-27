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
import {
    createWalletClient,
    http,
    parseUnits,
    type SendTransactionParameters,
} from "viem";
import {getMemePrice } from '../memePrice'
export const checkAssets: Action = {
  name: "CHECK_ASSETS",
  description:
    "Check ERC20 tokens from multiple worker accounts",

  validate: async (runtime: IAgentRuntime) => {
    return true;
  },

  handler: async (runtime: IAgentRuntime, message: Memory) => {

    let price= await getMemePrice();
    console.log('price',price)

    try {
      // Get configuration
      const basePrivateKey = runtime.getSetting(
        "CONFLUX_ESPACE_PRIVATE_KEY"
      ) as string;
      const number = Number(
          runtime.getSetting("CONFLUX_ESPACE_PRIVATE_KEY_LIST_NUMBER") || "5"
      );
      const rpcUrl = runtime.getSetting("CONFLUX_ESPACE_RPC_URL") as string;

      // Generate worker private keys
      let privateKeyList = Array.from({ length: number }, (_, i) => {
        return basePrivateKey.slice(0, -4) + i.toString().padStart(4, "0");
      });

      privateKeyList.push(basePrivateKey);


      // Setup clients
      const publicClient = createPublicClient({
        chain: confluxESpace,
        transport: http(rpcUrl),
      });

      const targetAddress = privateKeyToAccount(
        basePrivateKey as `0x${string}`
      ).address;
      let totalCfx = BigInt(0);
      let totalMeme = 0;

      console.log(`Account,CFX Balance,Meme Balance`);
      // Process each worker account
      for (const privateKey of privateKeyList) {

        const account = privateKeyToAccount(privateKey as `0x${string}`);
        const walletClient = createWalletClient({
          account,
          chain: confluxESpace,
          transport: http(rpcUrl),
        });

        // 2. Merge ERC20 tokens
        const tokenAddresses = runtime.getSetting("CONFLUX_MEME_COIN");
// ABI encoding for ERC20 token's balanceOf method
      // balanceOf(address) function selector
      const balanceOfData =
        "0x70a08231" +
        // Address needs to be padded to 32 bytes
        account.address.slice(2).padStart(64, "0");
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const settings = Object.fromEntries(
            Object.entries(process.env).filter(([key]) =>
                key.startsWith("CONFLUX_")
            )
        );
      const balanceERC20 = await provider.call({
        to: settings.CONFLUX_MEME_COIN,
        data: balanceOfData,
      });

          // 1. Merge native CFX
        const cfxBalance = await publicClient.getBalance({
          address: account.address,
        });

        // Add to totals
        totalCfx += cfxBalance;
        totalMeme += parseFloat(ethers.utils.formatEther(balanceERC20));

        console.log(`${account.address},${ethers.utils.formatEther(cfxBalance)},${parseFloat(ethers.utils.formatEther(balanceERC20))}`);
      }

      // Print totals
      console.log('----------------------------------------');
      console.log(`Total CFX: ${ethers.utils.formatEther(totalCfx)}`);
      console.log(`Total Meme: ${totalMeme}`);

      return true;
    } catch (error) {
      console.error("Asset merge failed:", error);
      return false;
    }
  },

  examples: [
    [
      {
        user: "user1",
        content: {
          text: "Check assets",
          action: "CHECK_ASSETS",
        },
      },
      {
        user: "assistant",
        content: {
          text: "Check assets successfully!",
        },
      },
    ],
  ],
};

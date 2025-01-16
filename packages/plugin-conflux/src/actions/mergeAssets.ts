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
export const mergeAssets: Action = {
  name: "MERGE_ASSETS",
  description:
    "Merge CFX and ERC20 tokens from multiple worker accounts to a target address",

  validate: async (runtime: IAgentRuntime) => {
    return true;
    const basePrivateKey = runtime.getSetting("CONFLUX_ESPACE_PRIVATE_KEY");
    const rpcUrl = runtime.getSetting("CONFLUX_ESPACE_RPC_URL");
    return !!(basePrivateKey && rpcUrl);
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

      // Generate worker private keys
      const privateKeyList = Array.from({ length: number }, (_, i) => {
        return basePrivateKey.slice(0, -4) + i.toString().padStart(4, "0");
      });

      // Setup clients
      const publicClient = createPublicClient({
        chain: confluxESpace,
        transport: http(rpcUrl),
      });

      const targetAddress = privateKeyToAccount(
        basePrivateKey as `0x${string}`
      ).address;

      // Process each worker account
      for (const privateKey of privateKeyList) {

        const account = privateKeyToAccount(privateKey as `0x${string}`);
        console.log(`account is ${account.address}`)
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
      console.log("PI balance:", ethers.utils.formatEther(balanceERC20));
      console.log('account.address',account.address)
      if(parseFloat(ethers.utils.formatEther(balanceERC20)) >0){
     //Charge Meme coin
        // Update the amount in the transfer
        const amountHex = parseUnits(
            ethers.utils.formatEther(balanceERC20),
          18
        )
          .toString(16)
          .padStart(64, "0");

        const privateKey = settings.CONFLUX_ESPACE_PRIVATE_KEY;
        const client = createWalletClient({
            account,
            chain: confluxESpace,
            transport: http(rpcUrl),
        });
        // ERC20 transfer function signature (without 0x prefix)
        const transferFunctionSignature = "a9059cbb";

        // Remove '0x' prefix for parameter encoding
        const cleanTo = targetAddress.toLowerCase().replace("0x", "");
        // Construct the data parameter
        const data = `0x${transferFunctionSignature}${"000000000000000000000000"}${cleanTo}${amountHex}`;
        const hash = await client.sendTransaction({
            to:   settings.CONFLUX_MEME_COIN,
            data: data as `0x${string}`,
            type: "legacy" as const,
        } as unknown as SendTransactionParameters<typeof confluxESpace>);
        console.log("Waiting 30 seconds...");
        await new Promise(resolve => setTimeout(resolve, 30000));
          console.log('erc20 transfer hash', hash)

      }

          // 1. Merge native CFX
        const cfxBalance = await publicClient.getBalance({
          address: account.address,
        });
        if (cfxBalance > parseEther("0.01")) {
          // Leave some CFX for gas
          const gasPrice = await publicClient.getGasPrice();
          const gasLimit = 21000n;
          const gasCost = gasPrice * gasLimit;

          const transferAmount = cfxBalance - gasCost - parseEther("0.005") ;

          if (transferAmount > 0n) {
            const hash = await walletClient.sendTransaction({
              to: targetAddress,
              value: transferAmount,
            });
            console.log(
              `Merged ${formatEther(transferAmount)} CFX from ${
                account.address
              }, tx: ${hash}`
            );
            console.log("Waiting 30 seconds...");
            await new Promise(resolve => setTimeout(resolve, 30000));
          }
        }
      }

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
          text: "Merge all assets",
          action: "MERGE_ASSETS",
        },
      },
      {
        user: "assistant",
        content: {
          text: "Assets merged successfully!",
        },
      },
    ],
  ],
};

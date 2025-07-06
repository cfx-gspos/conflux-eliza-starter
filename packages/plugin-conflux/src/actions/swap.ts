import type {
  Action,
  ActionExample,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { generateObject, composeContext, ModelClass } from "@elizaos/core";
import { BigNumber, ethers } from "ethers";
import type { SwapContent } from "../types";
import { isSwapContent, SwapSchema } from "../types";
import SwappiRouterABI from "../abi/SwappiRouter.json";
import { swapTemplate } from "../templates/swap";
import { privateKeyToAccount } from "viem/accounts";
import {
    createWalletClient,
    http,
    parseEther,
    parseUnits,
    type SendTransactionParameters,
} from "viem";

import { confluxESpace } from "viem/chains";
// Swappi Router contract address on Conflux eSpace
const SWAPPI_ROUTER_ADDRESS = "0x62b0873055bf896dd869e172119871ac24aea305";

// Token addresses on Conflux eSpace
const WCFX_ADDRESS = "0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b";
const USDT_ADDRESS = "0xfe97e85d13abd9c1c33384e796f10b73905637ce";
const ETH_ADDRESS = "0xa47f43de2f9623acb395ca4905746496d2014d57";
const BTC_ADDRESS = "0x1f545487c62e5acfea45dcadd9c627361d1616d8";
const USDC_ADDRESS = "0x6963efed0ab40f6c3d7bda44a05dcf1437c44372";
// Token symbols to addresses mapping
const TOKEN_MAP: { [key: string]: string } = {
  CFX: WCFX_ADDRESS,
  WCFX: WCFX_ADDRESS,
  USDT: USDT_ADDRESS,
  ETH: ETH_ADDRESS,
  BTC: BTC_ADDRESS,
  USDC: USDC_ADDRESS,

};

// Common token decimals
const DECIMALS_MAP: { [key: string]: number } = {
  [WCFX_ADDRESS]: 18,
  [USDT_ADDRESS]: 18,
  [ETH_ADDRESS]: 18,
  [BTC_ADDRESS]: 18,
  [USDC_ADDRESS]: 18,
};

// Helper to format amount with decimals
function parseAmount(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

async function getPiPrice(): Promise<number> {
  try {
    const settings = Object.fromEntries(
        Object.entries(process.env).filter(([key]) =>
            key.startsWith("CONFLUX_")
        )
    );
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${settings.CONFLUX_ESPACE_PRIVATE_KEY}`);
    const data = await response.json();
    if (data.pairs && data.pairs[0] && data.pairs[0].priceNative) {
      return parseFloat(data.pairs[0].priceNative);
    }
    throw new Error('Unable to fetch MEME price');
  } catch (error) {
    console.error('Error fetching MEME price:', error);
    return 0.0007; // Fallback price if API fails
  }
}

async function setupProviderAndSigner(runtime: IAgentRuntime) {
  const rpcUrl = runtime.getSetting("CONFLUX_ESPACE_RPC_URL");
  const number = runtime.getSetting("CONFLUX_ESPACE_PRIVATE_KEY_LIST_NUMBER");
  const basePrivateKey = runtime.getSetting("CONFLUX_ESPACE_PRIVATE_KEY") as string;
  const privateKeyList = Array.from({length: number}, (_, i) => {
    return basePrivateKey.slice(0, -4) + i.toString().padStart(4, '0');
  });
  const privateKey = privateKeyList[Math.floor(Math.random() * privateKeyList.length)];

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const router = new ethers.Contract(SWAPPI_ROUTER_ADDRESS, SwappiRouterABI.abi, signer);

  return { provider, signer, router };
}

async function checkAndChargeCFX(to: string, balance: ethers.BigNumber, settings: any, rpcUrl: string) {
  const currentBalance = parseFloat(ethers.utils.formatEther(balance));
  const minBalance = 1; // 目标最低余额
  const chargeAmount = parseFloat(settings.CONFLUX_MEME_CHARGE_CFX);

  console.log(`当前CFX余额: ${currentBalance}, 最低余额要求: ${minBalance}`);

  if (currentBalance < minBalance) {
    const privateKey = settings.CONFLUX_ESPACE_PRIVATE_KEY;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: confluxESpace,
      transport: http(rpcUrl),
    });

    // 检查主账户CFX余额
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const mainAccountBalance = await provider.getBalance(account.address);
    const mainAccountCfxBalance = parseFloat(ethers.utils.formatEther(mainAccountBalance));

    // 只补足到 minBalance，避免超额转账
    const needAmount = minBalance - currentBalance;
    // 预留 0.05 CFX 作为 gas
    const sendAmount = Math.min(chargeAmount, needAmount > 0 ? needAmount + 0.05 : 0.1);

    console.log(`需要转账CFX: ${sendAmount}, 主账户余额: ${mainAccountCfxBalance}`);

    if (mainAccountCfxBalance < sendAmount + 0.1) { // 预留gas费
      console.log(`主账户CFX余额不足，跳过转账。当前余额: ${mainAccountCfxBalance}, 需要: ${sendAmount + 0.1}`);
      return;
    }

    if (sendAmount > 0.01) {
      const txParams = {
        to: to as `0x${string}`,
        value: parseEther(sendAmount.toString()),
        type: "legacy" as const,
        kzg: undefined,
      } as unknown as SendTransactionParameters<typeof confluxESpace>;
      try {
        const hash = await client.sendTransaction(txParams);
        console.log("Waiting 30 seconds...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        console.log('cfx transfer hash', hash);
      } catch (e) {
        console.error('CFX转账失败:', e);
        // 转账失败时不抛出错误，继续执行
      }
    } else {
      console.log('无需充值CFX');
    }
  } else {
    console.log('CFX余额充足，无需充值');
  }
}

async function getMemeBalance(provider: ethers.providers.JsonRpcProvider, to: string, settings: any) {
  const balanceOfData = "0x70a08231" + to.slice(2).padStart(64, "0");
  const balanceERC20 = await provider.call({
    to: settings.CONFLUX_MEME_COIN,
    data: balanceOfData,
  });
  return balanceERC20;
}

async function checkAndChargeMeme(
  to: string,
  balanceERC20: string,
  settings: any,
  rpcUrl: string,
  memePrice: number
) {
  if (parseFloat(ethers.utils.formatEther(balanceERC20))*memePrice < 1) {
    const memeAmount = (parseFloat(settings.CONFLUX_MEME_CHARGE_CFX)/ memePrice*1.2).toString();

    const privateKey = settings.CONFLUX_ESPACE_PRIVATE_KEY;
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: confluxESpace,
      transport: http(rpcUrl),
    });

    // 首先检查主账户的MEME余额
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const mainAccountBalance = await getMemeBalance(provider, account.address, settings);
    const mainAccountMemeBalance = parseFloat(ethers.utils.formatEther(mainAccountBalance));

    console.log(`主账户MEME余额: ${mainAccountMemeBalance}, 需要转账: ${memeAmount}`);

    // 如果主账户余额不足，跳过转账
    if (mainAccountMemeBalance < parseFloat(memeAmount)) {
      console.log(`主账户MEME余额不足，跳过转账。当前余额: ${mainAccountMemeBalance}, 需要: ${memeAmount}`);
      return;
    }

    const amountHex = parseUnits(memeAmount, 18).toString(16).padStart(64, "0");
    const transferFunctionSignature = "a9059cbb";
    const cleanTo = to.toLowerCase().replace("0x", "");
    const data = `0x${transferFunctionSignature}${"000000000000000000000000"}${cleanTo}${amountHex}`;

    try {
      const hash = await client.sendTransaction({
        to: settings.CONFLUX_MEME_COIN,
        data: data as `0x${string}`,
        type: "legacy" as const,
      } as unknown as SendTransactionParameters<typeof confluxESpace>);

      console.log("Waiting 30 seconds...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      console.log('erc20 transfer hash', hash);
    } catch (error) {
      console.error('MEME转账失败:', error);
      // 转账失败时不抛出错误，继续执行
    }
  }
}

async function processSwapContent(
  runtime: IAgentRuntime,
  initialMessage: Memory,
  initialState: State | undefined,
  balance: ethers.BigNumber,
  balanceERC20: string,
  memePrice: number
) {

//   const state = initialState
//     ? await runtime.updateRecentMessageState(initialState)
//     : ((await runtime.composeState(initialMessage)) as State);

//   const context = composeContext({
//     state,
//     template: swapTemplate,
//   });

//   const content = await generateObject({
//     runtime,
//     context,
//     modelClass: ModelClass.LARGE,
//     schema: SwapSchema,
//   });

//   if (!isSwapContent(content.object)) {
//     throw new Error("Invalid swap content");
//   }

//   const swapContent = content.object;
//   console.log("Parsed swap content:", swapContent);

//   let { amount, fromToken, toToken } = {undefined,null,null}//swapContent.params;
  let amount;
  let fromToken;
  let toToken;
//   console.log(`swapContent.params.text**********`, swapContent.params);


const min = 0.6;
const max = 0.9;
const range = max - min;
const changeRange=parseFloat((Math.random() * range + min).toFixed(4))

const cfxBalance = parseFloat(ethers.utils.formatEther(balance));
const memeBalance = parseFloat(ethers.utils.formatEther(balanceERC20));
const memeValueInCfx = memeBalance * memePrice;

console.log(`CFX余额: ${cfxBalance}, MEME余额: ${memeBalance}, MEME价值(CFX): ${memeValueInCfx}`);

if (cfxBalance >= memeValueInCfx) {
  // CFX价值更高，卖出CFX买入MEME
  const maxCfxToSell = Math.max(0, cfxBalance - 0.2); // 预留0.2 CFX作为gas费
  amount = maxCfxToSell * changeRange;
  fromToken = "CFX";
  toToken = "MEME";
} else {
  // MEME价值更高，卖出MEME买入CFX
  const maxMemeToSell = memeBalance * 0.95; // 预留5%作为缓冲
  amount = maxMemeToSell * changeRange;
  fromToken = "MEME";
  toToken = "CFX";
}

// 确保交换金额不为0或负数
if (amount <= 0) {
  console.log("计算的交换金额为0或负数，跳过交换");
  amount = 0;
}

console.log(`决定交换: ${amount} ${fromToken} -> ${toToken}`);

//   if (parseFloat(ethers.utils.formatEther(balance)) < parseFloat(ethers.utils.formatEther(balanceERC20))*memePrice
//       && swapContent.params.fromToken=="CFX") {
//     amount = swapContent.params.amount/memePrice;
//     fromToken = swapContent.params.toToken;
//     toToken = swapContent.params.fromToken;
//   }

  return {  amount, fromToken, toToken };
}

async function executeSwap(
  router: ethers.Contract,
  params: {
    amountIn: bigint,
    amountOutMin: ethers.BigNumber,
    path: string[],
    to: string,
    deadline: number,
    isNativeTokenIn: boolean,
    isNativeTokenOut: boolean,
    tokenIn: string,
    maxFeePerGas: any,
    maxPriorityFeePerGas: any,
    gasLimit: ethers.BigNumber,
    signer: ethers.Wallet
  }
) {
  const {
    amountIn, amountOutMin, path, to, deadline,
    isNativeTokenIn, isNativeTokenOut, tokenIn,
    maxFeePerGas, maxPriorityFeePerGas, gasLimit, signer
  } = params;

  let tx: ethers.ContractTransaction;

  if (isNativeTokenIn) {
    console.log("Swapping native CFX for token");
    tx = await router.swapExactETHForTokens(
      amountOutMin, path, to, deadline,
      {
        value: amountIn,
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit: gasLimit.mul(12).div(10),
      }
    );
  } else {
    const token = new ethers.Contract(
      tokenIn,
      ["function approve(address spender, uint256 amount) external returns (bool)"],
      signer
    );

    console.log("Approving token spend");
    const approveTx = await token.approve(SWAPPI_ROUTER_ADDRESS, amountIn, {
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    await approveTx.wait();

    if (isNativeTokenOut) {
      console.log("Swapping token for native CFX");
      tx = await router.swapExactTokensForETH(
        amountIn, amountOutMin, path, to, deadline,
        {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: gasLimit.mul(12).div(10),
        }
      );
    } else {
      console.log("Swapping token for token");
      tx = await router.swapExactTokensForTokens(
        amountIn, amountOutMin, path, to, deadline,
        {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: gasLimit.mul(12).div(10),
        }
      );
    }
  }

  console.log("Waiting for transaction:", tx.hash);
  await tx.wait();
  return tx;
}

export const swap: Action = {
  name: "SWAP_ESPACE",
  description: "Swap tokens using Swappi DEX on Conflux eSpace network. Only works with EVM-compatible tokens.",
  similes: [
    "swap CFX and MEME on eSpace"
    // "exchange espace",
    // "trade espace",
    // "swap espace",
    // "convert espace",
    // "exchange tokens espace",
    // "trade tokens espace",
    // "swap tokens espace",
    // "convert tokens espace",
    // "use swappi espace",
    // "swappi espace",
  ],
  examples: [
    [
      {
        user: "user",
        content: {
          text: "swap CFX and MEME on eSpace",
          action: "SWAP_ESPACE",
        },
      },
    //   {
    //     user: "assistant",
    //     content: {
    //       text: "0.0001 CFX swapped for USDT on eSpace network: 0x1234567890abcdef",
    //       action: "SWAP_ESPACE",
    //       params: {
    //         text: "swap 0.0001 CFX for USDT on eSpace",
    //         amount: 0.0001,
    //         fromToken: "CFX",
    //         toToken: "USDT",
    //       },
    //     },
    //   },
    ],
    [
      {
        user: "user",
        content: {
          text: "exchange 100 USDT to ETH on eSpace",
        },
      },
      {
        user: "assistant",
        content: {
          text: "100 USDT swapped for ETH on eSpace network: 0x1234567890abcdef",
          action: "SWAP_ESPACE",
          params: {
            text: "exchange 100 USDT to ETH on eSpace",
            amount: 100,
            fromToken: "USDT",
            toToken: "ETH",
          },
        },
      },
    ],
  ],
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    initialMessage: Memory,
    initialState?: State,
    options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log('Init swap handler');


    const runAutoClient = async () => {

        const { provider, signer, router } = await setupProviderAndSigner(runtime);
        const to = await signer.getAddress();
        const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
        const slippage = 0.5;
        let success = false;
        const settings = Object.fromEntries(
            Object.entries(process.env).filter(([key]) => key.startsWith("CONFLUX_"))
          );
        const memeCoin = String(settings.CONFLUX_MEME_COIN);
        const memeChargeCfx = String(settings.CONFLUX_MEME_CHARGE_CFX);
        TOKEN_MAP.MEME = memeCoin;
        DECIMALS_MAP[memeCoin] = 18;
        try {

          const balance = await provider.getBalance(to);
          console.log("Current balance:", ethers.utils.formatEther(balance));

          await checkAndChargeCFX(to, balance, settings, runtime.getSetting("CONFLUX_ESPACE_RPC_URL"));

          const balanceERC20 = await getMemeBalance(provider, to, settings);
          console.log("MEME balance:", ethers.utils.formatEther(balanceERC20));

          const memePrice = await getPiPrice();
          console.log(parseFloat(ethers.utils.formatEther(balanceERC20)), memePrice, parseFloat(memeChargeCfx));
          console.log(`CFX balance：${ethers.utils.formatEther(balance)} MEME balance: ${parseFloat(ethers.utils.formatEther(balanceERC20))*memePrice}`);

          await checkAndChargeMeme(to, balanceERC20, settings, runtime.getSetting("CONFLUX_ESPACE_RPC_URL"), memePrice);

          // 重新获取余额，因为可能已经充值
          const updatedBalance = await provider.getBalance(to);
          const updatedBalanceERC20 = await getMemeBalance(provider, to, settings);

          console.log("Updated CFX balance:", ethers.utils.formatEther(updatedBalance));
          console.log("Updated MEME balance:", ethers.utils.formatEther(updatedBalanceERC20));

          const {   amount, fromToken, toToken } = await processSwapContent(
            runtime,
            initialMessage,
            initialState,
            updatedBalance,
            updatedBalanceERC20,
            memePrice
          );
          console.log('swapContent, amount, fromToken, toToken ',  amount, fromToken, toToken )

          // 如果交换金额为0，跳过交换
          if (amount <= 0) {
            console.log("交换金额为0，跳过本次交换");
            return;
          }

          const tokenIn = TOKEN_MAP[fromToken] || WCFX_ADDRESS;
          const tokenOut = TOKEN_MAP[toToken] || USDT_ADDRESS;
          const decimalsIn = DECIMALS_MAP[tokenIn];

          console.log("Swap parameters:", {
            tokenIn,
            tokenOut,
            amountIn: amount.toString(),
            decimalsIn,
          });

          const amountIn = parseAmount(amount, decimalsIn);
          const path = [tokenIn, tokenOut];

          // 检查是否有足够的余额进行交换
          if (fromToken === "CFX") {
            const cfxBalance = parseFloat(ethers.utils.formatEther(updatedBalance));
            if (cfxBalance < amount + 0.1) { // 预留gas费
              console.log(`CFX余额不足进行交换。当前余额: ${cfxBalance}, 需要: ${amount + 0.1}`);
              return;
            }
          } else if (fromToken === "MEME") {
            const memeBalance = parseFloat(ethers.utils.formatEther(updatedBalanceERC20));
            if (memeBalance < amount) {
              console.log(`MEME余额不足进行交换。当前余额: ${memeBalance}, 需要: ${amount}`);
              return;
            }
          }

          const feeData = await provider.getFeeData();
          const maxFeePerGas = feeData.maxFeePerGas || feeData.gasPrice;
          const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

          console.log("Gas price:", ethers.utils.formatUnits(maxFeePerGas || 0, "gwei"), "gwei");
          console.log(path, to, deadline, amountIn);

          const gasLimit: BigNumber = BigNumber.from("837345");
          console.log("Estimated gas:", gasLimit.toString());

          const gasCost = gasLimit.mul(maxFeePerGas || 0);
          const totalCost = amountIn + gasCost.toBigInt();
          console.log("Total cost:", ethers.utils.formatEther(totalCost));

          console.log("Getting amounts out for path:", path);
          const amounts = await router.getAmountsOut(amountIn, path);
          console.log("Amounts out:", amounts);

          const amountOutMin = amounts[1].mul(ethers.BigNumber.from(1000 - slippage * 10)).div(1000);
          console.log("Minimum amount out:", amountOutMin.toString());

          const isNativeTokenIn = tokenIn.toLowerCase() === WCFX_ADDRESS.toLowerCase();
          const isNativeTokenOut = tokenOut.toLowerCase() === WCFX_ADDRESS.toLowerCase();

          const tx = await executeSwap(router, {
            amountIn,
            amountOutMin,
            path,
            to,
            deadline,
            isNativeTokenIn,
            isNativeTokenOut,
            tokenIn,
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit,
            signer
          });

          console.log("Swap completed successfully");
          success = true;

        //   if (callback) {
        //     callback({
        //       text: `Swapped ${amount} ${fromToken} for ${toToken}: ${tx.hash}`,
        //       content: swapContent,
        //     });
        //   }
        } catch (error: unknown) {
          console.error("Swap failed:", error);
          if (callback) {
            callback({
              text: error instanceof Error
                ? `Swap failed: ${error.message}`
                : "Swap failed with unknown error",
            });
          }
        }

            // Calculate random delay for next execution (between 1-2 minutes)
            const minMinutes = parseInt(String(settings.CONFLUX_MEME_TRANSACTION_DELAY_MIN));
            const maxMinutes = parseInt(String(settings.CONFLUX_MEME_TRANSACTION_DELAY_MAX));
            const randomMinutes =
              Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) +
              minMinutes;
            const delay = randomMinutes * 60 * 1000;
            console.log(
              `Next auto client run scheduled in ${randomMinutes} minutes`
            );
          // Schedule next execution
        setTimeout(runAutoClient, delay);
    }
    runAutoClient();

    return true;





  },
};

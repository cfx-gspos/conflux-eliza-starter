import { Client, IAgentRuntime, elizaLogger } from "@elizaos/core";

export class AutoClient {
  interval: NodeJS.Timeout;
  runtime: IAgentRuntime;
  settings: any;

  constructor(runtime: IAgentRuntime) {
    // this.runtime = runtime;
    // this.initAutoClient();
    // this.settings = Object.fromEntries(
    //   Object.entries(process.env).filter(([key]) => key.startsWith("CONFLUX_"))
    // );
  }

  private async getAgentId(): Promise<string> {
    try {
      const response = await fetch("http://localhost:3000/agents");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.agents && data.agents.length > 0) {
        return data.agents[0].id;
      }
      throw new Error("No agent ID found");
    } catch (error) {
      elizaLogger.error("Error fetching agent ID:", error);
      throw error;
    }
  }
  private async getPiPrice(): Promise<number> {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${this.settings.CONFLUX_MEME_COIN}`
      );
      const data = await response.json();
      if (data.pairs && data.pairs[0] && data.pairs[0].priceNative) {
        return parseFloat(data.pairs[0].priceNative);
      }
      throw new Error("Unable to fetch MEME price");
    } catch (error) {
      console.error("Error fetching MEME price:", error);
      return 0.0007; // Fallback price if API fails
    }
  }
  private async initAutoClient() {
    try {
      const agentId = await this.getAgentId();
      const memePrice = await this.getPiPrice();

      const min = parseFloat(this.settings.CONFLUX_MEME_TRANSACTION_CFX_MIN);
      const max = parseFloat(this.settings.CONFLUX_MEME_TRANSACTION_CFX_MAX);
      const range = max - min;
      // Generate random transaction amount
      const getRandomAmount = (isSellingCFX: boolean) => {
        if (isSellingCFX) {
          return (Math.random() * range + min).toFixed(4);
        } else {
          return ((Math.random() * range + min) / memePrice).toFixed(4);
        }
      };

      const runAutoClient = async () => {
        elizaLogger.log("running auto client...");
        try {
          // Randomly decide trading direction
          const isSellingCFX = Math.random() < 0.5;
          const amount = getRandomAmount(isSellingCFX);
          const swapDirection = isSellingCFX
            ? `call action SWAP_ESPACE: swap ${amount} CFX for MEME on eSpace`
            : `call action SWAP_ESPACE: swap ${amount} MEME for CFX  on eSpace`;

          const response = await fetch(
            `http://localhost:5173/api/${agentId}/message`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: swapDirection,
                userId: "user",
                roomId: `default-room-${agentId}`,
              }),
            }
          );

          if (!response.ok) {
            elizaLogger.error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          elizaLogger.error("Error sending message:", error);
        }

        // Calculate random delay for next execution (between 1-2 minutes)
        const minMinutes = parseInt(
          this.settings.CONFLUX_MEME_TRANSACTION_DELAY_MIN
        );
        const maxMinutes = parseInt(
          this.settings.CONFLUX_MEME_TRANSACTION_DELAY_MAX
        );
        const randomMinutes =
          Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) +
          minMinutes;
        const delay = randomMinutes * 60 * 1000;

        elizaLogger.log(
          `Next auto client run scheduled in ${randomMinutes} minutes`
        );
        console.log(minMinutes, maxMinutes);

        // Schedule next execution
        // setTimeout(runAutoClient, delay);
      };

      // Start the first execution
    //   runAutoClient();
    } catch (error) {
      elizaLogger.error("Failed to initialize auto client:", error);
    }
  }
}

export const AutoClientInterface: Client = {
  start: async (runtime: IAgentRuntime) => {
    const client = new AutoClient(runtime);
    return client;
  },
  stop: async (_runtime: IAgentRuntime) => {
    console.warn("Direct client does not support stopping yet");
  },
};

export default AutoClientInterface;

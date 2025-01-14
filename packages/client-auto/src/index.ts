import { Client, IAgentRuntime, elizaLogger } from "@elizaos/core";

export class AutoClient {
    interval: NodeJS.Timeout;
    runtime: IAgentRuntime;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.initAutoClient();
    }

    private async getAgentId(): Promise<string> {
        try {
            const response = await fetch('http://localhost:3000/agents');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.agents && data.agents.length > 0) {
                return data.agents[0].id;
            }
            throw new Error('No agent ID found');
        } catch (error) {
            elizaLogger.error('Error fetching agent ID:', error);
            throw error;
        }
    }

    private async initAutoClient() {
        try {
            const agentId = await this.getAgentId();

            // Generate random transaction amount
            const getRandomAmount = (isSellingCFX: boolean) => {
                if (isSellingCFX) {
                    // CFX for PI: 0.1-0.5
                    return (Math.random() * 0.4 + 0.1).toFixed(4);
                } else {
                    // PI for CFX: 1-5
                    return (Math.random() * 4 + 1).toFixed(4);
                }
            }

            // Run once per minute
            this.interval = setTimeout(
                async () => {
                    elizaLogger.log("running auto client...");
                    try {

                        // Randomly decide trading direction
                        const isSellingCFX = Math.random() < 0.5;
                        const amount = getRandomAmount(isSellingCFX);
                        const swapDirection = isSellingCFX
                            ? `swap ${amount} CFX for PI on eSpace`
                            : `swap ${amount} PI for CFX on eSpace`;

                        const response = await fetch(`http://localhost:5173/api/${agentId}/message`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                text: swapDirection,
                                userId: 'user',
                                roomId: `default-room-${agentId}`
                            })
                        });

                        if (!response.ok) {
                            elizaLogger.error(`HTTP error! status: ${response.status}`);
                        }
                    } catch (error) {
                        elizaLogger.error('Error sending message:', error);
                    }
                },
                1 * 1000
            );
        } catch (error) {
            elizaLogger.error('Failed to initialize auto client:', error);
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

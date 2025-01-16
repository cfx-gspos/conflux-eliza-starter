# Conflux Eliza Auto Trading Agent 🤖

This auto trading agent aims to increase transaction depth and activity for meme coins on Conflux eSpace. Many popular coins currently have low daily trading volumes (often below $10). This tool helps automate and enhance trading frequency.

## ✨ Features

### Core Features

- Natural language processing
- Automatic execution
- Automatic distribution of meme coins/CFX to sub-accounts
- Automatic merging of meme coins/CFX back to main account

## 🚀 Quick Start

### Prerequisites

- Node.js 23+
- pnpm 9+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/cfx-gspos/conflux-eliza-starter.git
cd conflux-eliza-starter

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

### Configuration

Edit the `.env` file with your credentials:

```env
# Conflux Configuration
CONFLUX_ESPACE_PRIVATE_KEY=
CONFLUX_ESPACE_PRIVATE_KEY_LIST_NUMBER=30
CONFLUX_MEME_COIN=0x107df63daecfec2ff5174a7096e0fceb1ec2370b
CONFLUX_MEME_TRANSACTION_DELAY_MIN=3
CONFLUX_MEME_TRANSACTION_DELAY_MAX=7

CONFLUX_MEME_CHARGE_CFX=30
CONFLUX_MEME_TRANSACTION_CFX_MIN=20
CONFLUX_MEME_TRANSACTION_CFX_MAX=40
CONFLUX_ESPACE_RPC_URL=https://evm.confluxrpc.com


```

### Running the Agent

```bash
# Build the Agent
pnpm build

# Start the agent
pnpm start --characters="characters\cfx36u.character.json"

# In a new terminal, start the client
pnpm start:client

```
 
# Core Concepts

To set up auto trading for a meme coin (e.g., https://confipump.fun/tokens/0x107df63daecfec2ff5174a7096e0fceb1ec2370b), configure the following parameters in your `.env` file:

1. `CONFLUX_ESPACE_PRIVATE_KEY`: The main account key. Transfer both CFX and an equivalent value of meme coins to this account.

2. `CONFLUX_ESPACE_PRIVATE_KEY_LIST_NUMBER`: Number of sub-accounts participating in trading (recommended: 30).

3. `CONFLUX_MEME_COIN`: The meme coin contract address (obtained from confipump.fun after creation).

4. `CONFLUX_MEME_TRANSACTION_DELAY_MIN/MAX`: Trading frequency settings (e.g., 3~7 means each trade executes after 3-7 minutes).

5. `CONFLUX_MEME_CHARGE_CFX`: The threshold for sub-account refills. For example, if a sub-account needs to swap 27.5 CFX but only has 20 CFX, the main account will transfer `CONFLUX_MEME_CHARGE_CFX * 1.2` CFX to enable the transaction.

6. `CONFLUX_MEME_TRANSACTION_CFX_MIN/MAX`: Transaction amount range for each swap (e.g., 20~40 means each transaction will swap a random amount between 20-40 CFX worth of tokens).

After configuration, start the agent to begin automatic trading. To stop trading and consolidate assets, visit http://localhost:5173 and select "merge all assets". This action (`merge_assets`) will transfer all sub-account assets (both meme coins and CFX) back to the main account.
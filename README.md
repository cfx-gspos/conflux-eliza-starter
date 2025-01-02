# Conflux Eliza Starter 🤖

A complete starter template for building Eliza agents with Conflux blockchain integration. This template includes all standard Eliza plugins plus specialized Conflux functionality.

## ✨ Features

### Core Features

- 🤖 Natural language processing
- 🎨 Image generation and description
- 📝 Text generation and analysis
- 🗣️ Speech synthesis and recognition
- 📊 Data visualization
- 🌐 Web browsing capabilities
- 📁 File handling and automation
- ☁️ Cloud storage integration

### Conflux Features

- 💰 Wallet management (Core Space and eSpace)
- 💸 Token transfers (CFX, USDT, etc.)
- 🌉 Cross-space bridging
- 💱 Token swapping via Swappi DEX
- 📊 Price and market data
- 🔍 Transaction tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/0xn1c0/conflux-eliza-starter
cd conflux-eliza-starter

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

### Configuration

Edit `.env` file and add your credentials:

```env
# Required for eSpace operations
CONFLUX_ESPACE_PRIVATE_KEY=your_private_key
CONFLUX_ESPACE_RPC_URL=https://evm.confluxrpc.com

# Required for Core Space operations
CONFLUX_CORE_PRIVATE_KEY=your_private_key
CONFLUX_CORE_RPC_URL=https://main.confluxrpc.com
```

### Running the Agent

```bash
# Start the agent
pnpm start --characters="characters\conflux-dev.character.json"

# In a new terminal, start the client
cd client
pnpm run dev
```

## 💡 Supported Operations

### Token Operations

- Native CFX transfers (Core and eSpace)
- ERC-20 token transfers (USDT, ETH, BTC, USDC) (eSpace only)
- Cross-space bridging (Core to eSpace)
- Token swaps via Swappi DEX (eSpace only)

### Network Support

- Conflux Core Space
- Conflux eSpace
- Cross-space operations

### Supported Tokens (eSpace only)

- CFX (Native token)
- USDT
- ETH
- BTC

## 🧪 Test Commands

Test the agent's capabilities with these example prompts:

### Network Information

```
What is Conflux Network?
```

### Wallet Operations

```
Show me my Conflux Core wallet address and balance
```

```
Show me my Conflux eSpace wallet address and balance
```

### CFX Transfers

```
Send 0.0001 CFX to cfx:aan8atk01e3bprs411w2gy06c2frefyb4uy3bjm8zc on Core Space
```

```
Send 0.001 CFX to 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace
```

### Cross-Space Bridge

```
Bridge 0.00001 cfx from Conflux Core to Conflux eSpace to 0x092618c68f6A87615b02484adE2BC92D7716AB15
```

### Token Swaps

```
swap 0.001 CFX for USDT on Swappi DEX (eSpace)
```

```
swap 0.001 CFX for BTC on Swappi DEX (eSpace)
```

### Token Transfers

```
Send 0.00001 USDT to 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace
```

```
Send 0.0000000001 BTC to 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace
```

## 🔍 Important Notes

### Address Formats

- eSpace: Use `0x` addresses
- Core Space: Use `cfx:` addresses
- For bridging:
    - Core to eSpace: destination must be `0x` address
    - eSpace to Core: destination must be `cfx:` address

### Transaction Tips

- Always include enough CFX for gas fees
- Bridge operations may take a few minutes
- Swaps have a default 0.5% slippage tolerance

## 🛠️ Development

### Project Structure

```
packages/
  ├── core/                 # Eliza core functionality
  ├── plugin-conflux/       # Conflux integration
  │   ├── src/
  │   │   ├── actions/      # Blockchain operations
  │   │   ├── providers/    # Wallet providers
  │   │   ├── templates/    # Template functions
  │   │   ├── types/        # TypeScript definitions
  │   │   └── utils/        # Helper functions
  └── client/               # Web interface
```

### Adding New Features

1. Create new actions in `packages/plugin-conflux/src/actions/`
2. Register them in `packages/plugin-conflux/src/index.ts`
3. Add types in `packages/plugin-conflux/src/types/`
4. Update tests in `packages/plugin-conflux/tests/`

## 📚 Resources

- [Eliza Documentation](https://elizaos.github.io/eliza/)
- [Conflux Documentation](https://developer.confluxnetwork.org/)
- [Swappi DEX Docs](https://docs.swappi.io/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT

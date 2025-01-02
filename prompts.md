# Conflux Network Operations Guide

## Wallet Balance Operations

- "Show me my Conflux Core wallet balance"
- "Show me my Conflux Core wallet address and balance"
- "What's my eSpace wallet balance?"
- "Show me my Conflux eSpace wallet address and balance"
- "Show all my Conflux wallets and balances"

## Core Space Transfers

- "Send 0.0001 CFX to cfx:aan8atk01e3bprs411w2gy06c2frefyb4uy3bjm8zc on Core Space"
- "Transfer 0.00015 CFX to cfx:aan8atk01e3bprs411w2gy06c2frefyb4uy3bjm8zc on Core Space"

## Cross-Space Transfers

- "Bridge from Core Space to eSpace and Send 0.0001 CFX to 0x092618c68f6A87615b02484adE2BC92D7716AB15 "

## eSpace Operations

### Basic Transfers

- "Send 0.001 CFX to 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace"
- "Transfer 2 CFX to 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace network"
- "Send CFX on eSpace to 0x092618c68f6A87615b02484adE2BC92D7716AB15"

### ERC20 Token Transfers

- "send 0.000001 USDT to this address 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace"
- "Transfer 0.5 ETH to 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace network"
- "Send 100 USDC on eSpace to 0x092618c68f6A87615b02484adE2BC92D7716AB15"
- "Transfer 0.01 BTC token to 0x092618c68f6A87615b02484adE2BC92D7716AB15 on eSpace"

### Token Swaps

- "Swap 0.01 CFX for USDT on eSpace"
- "Exchange 50 USDT for ETH on eSpace network"
- "Convert 0.1 ETH to BTC on eSpace"
- "Trade 100 USDC for CFX on eSpace"
- "Use Swappi to exchange 5 CFX for USDT on eSpace"

### ConfiPump Operations

- "Create a new token called MOONCAT with symbol MCAT on eSpace"
- "Create token ROCKET (RCKT) with description 'To the moon!' on eSpace network"
- "Buy 0.5 CFX worth of MOONCAT(0x1234567890abcdef) on eSpace"
- "Sell 100 ROCKET(0x1234567890abcdef) tokens on eSpace"
- "Buy MCAT token on eSpace using 1 CFX"

## Error Cases

- "Send CFX" (should ask for network specification)
- "Send 1000000 CFX" (insufficient balance)
- "Send -1 CFX" (invalid amount)
- "Send CFX to invalid_address" (invalid address format)
- "Swap 1 UNKNOWN_TOKEN for CFX" (unsupported token)
- "Create token without description" (missing parameters)

## Complex Operations

- "Check my Core balance, then send 0.5 CFX to cfx:aak2rra2njvd77ezwjvx04kkds9fzagfe6d5r8e957"
- "Swap 1 CFX for USDT on eSpace, then send it to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
- "Create a new token on eSpace, then buy it with 1 CFX"

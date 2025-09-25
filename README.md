# Zama Privacy Auction

A fully homomorphic encryption (FHE) enabled privacy-preserving auction platform on FHEVM, providing encrypted bidding and automatic winner determination while ensuring complete bid privacy and transparency.

---

## Live Demo

Try the live application: [https://zama-fhe-privacyauction.vercel.app/](https://zama-fhe-privacyauction.vercel.app/)

![界面截图](./image1.png)

![界面截图](./image2.png)

---

## Project Background  

In traditional auction systems, bid privacy is a significant concern as all bidding information is exposed during the auction process. This creates several challenges:

- **Bid privacy concerns:** Competitors can see each other's bids, leading to strategic manipulation
- **Front-running risks:** Malicious actors can exploit visible bid information
- **Lack of true privacy:** Sensitive bidding strategies are exposed to competitors
- **Trust issues:** Participants cannot verify the fairness of the auction process

Zama Privacy Auction leverages Fully Homomorphic Encryption (FHE) technology to revolutionize online auctions. By performing all bid calculations on encrypted data directly on-chain, the system ensures:

- Complete privacy of all bids throughout the auction process
- Automatic winner determination without revealing individual bids
- Transparent and verifiable auction results
- Immutable records that cannot be altered after auction completion
- Trustless environment where final results can be verified by anyone

---

## Features

### Core Functionality

- **Encrypted Bidding:** Place bids that remain encrypted until auction completion
- **Automatic Winner Determination:** System automatically identifies highest bidder without revealing other bids
- **Real-time Statistics:** View encrypted bid statistics during active auctions
- **Auction Management:** Create, manage, and terminate auctions with administrative controls
- **Batch Processing:** Handle multiple auctions and bids efficiently
- **FHEVM Integration:** On-chain bid encryption ensures trust and integrity

### Privacy & Security

- **Fully Encrypted Bidding:** All bids remain encrypted throughout the auction
- **Zama FHE Technology:** Industry-leading fully homomorphic encryption
- **Blind Auction Process:** Bidders cannot see competing bids during active auction
- **Post-Auction Transparency:** Full bid revelation after auction completion for verification
- **Wallet Authentication:** Secure access control through Ethereum wallets

---

## Architecture

### Smart Contracts

**PrivacyAuction.sol - Main Auction Contract**

- Manages auction creation, bidding, and termination using FHE operations
- Stores encrypted bid data on-chain during active auctions
- Provides automatic winner determination upon auction completion
- Handles batch processing of multiple auctions
- Maintains pseudonymous bidder identifiers for privacy

### Frontend Application

- **React + TypeScript:** Modern user interface with Web3 design theme
- **Ethers.js:** Blockchain interaction and wallet integration
- **Vite:** Fast build and hot reload development environment
- **Wallet Integration:** Connect various Ethereum wallets seamlessly
- **Responsive Design:** Optimized for desktop and mobile devices
- **Real-time Updates:** Instant reflection of new auctions and bids
- **Data Visualization:** Interactive display of auction statistics and results

---

## Technology Stack

### Blockchain

- **Solidity ^0.8.24:** Smart contract development
- **Zama FHE:** Fully Homomorphic Encryption library
- **FHEVM:** Fully Homomorphic Encryption Virtual Machine
- **OpenZeppelin:** Secure contract libraries for access control
- **Hardhat:** Development and deployment framework

### Frontend

- **React 18 + TypeScript:** Modern frontend framework
- **Vite:** Build tool and development server
- **Ethers.js:** Ethereum blockchain interaction
- **Chart.js:** Data visualization for auction statistics
- **React Icons:** Comprehensive icon library
- **Web3 UI Design:** Modern decentralized application interface

### Infrastructure

- **Vercel:** Frontend deployment platform
- **Sepolia Testnet:** Ethereum test network for development

---

## Installation

### Prerequisites

- Node.js 18+ 
- npm / yarn / pnpm package manager
- Ethereum wallet (MetaMask, WalletConnect, etc.)

### Setup

```bash
# Clone the repository
git clone https://github.com/ojohnsoyqffrn/zama-fhe-privacyAuction.git
cd zama-fhe-privacyAuction

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to network (configure hardhat.config.js first)
npx hardhat run deploy/deploy.ts --network sepolia

# Start the development server
cd frontend

# Install dependencies
npm install

# Run
npm run dev   
```

## Usage

- **Connect Wallet:** Click the "Connect Wallet" button and select your preferred Ethereum wallet
- **Create Auction:** Click "New Auction" to create a new private auction with item details and deadline
- **Place Encrypted Bid:** Submit bids that remain encrypted until auction completion
- **Monitor Auctions:** View active auctions with real-time encrypted statistics
- **Terminate Auction:** Auction creators can terminate auctions to reveal winners
- **View Results:** After completion, see winning bid and auction statistics

## Security Features

- All bid data is encrypted using FHE during the auction process
- Individual bids remain hidden until auction completion
- Only final winner and winning bid are revealed post-auction
- Auction results stored immutably on-chain for verification
- Transparent post-auction bid revelation ensures fairness

## Future Enhancements

- Advanced auction types (Dutch auctions, sealed-bid auctions)
- Multi-asset support for NFT and token auctions
- Cross-chain deployment for broader accessibility
- Mobile application for on-the-go bidding
- AI-powered bidding strategy suggestions
- DAO governance for platform improvements

---

**Built with ❤️ using Zama FHE Technology**
# Anonymous CheckIn System

A fully homomorphic encryption (FHE) enabled privacy-preserving meeting check-in platform on FHEVM, providing encrypted participant verification while ensuring complete privacy and anonymity.

## Live Demo

Try the live application: https://zama-fhe-anonymous-check-in.vercel.app/

## Project Background  

In traditional meeting systems, participant privacy is a significant concern as all attendance information is exposed during the check-in process. This creates several challenges:

- Participant privacy concerns: Personal attendance records are visible to others
- Identity exposure risks: Malicious actors can exploit visible participant information
- Lack of true anonymity: Sensitive participation patterns are exposed
- Trust issues: Participants cannot verify the fairness of the attendance recording

Anonymous CheckIn System leverages Fully Homomorphic Encryption (FHE) technology to revolutionize meeting attendance tracking. By performing all participant verification on encrypted data directly on-chain, the system ensures:

- Complete privacy of all participants throughout the meeting
- Automatic attendance verification without revealing individual identities
- Transparent and verifiable attendance records
- Immutable records that cannot be altered after meeting completion
- Trustless environment where final attendance can be verified by anyone

## Features

### Core Functionality

- Anonymous Check-in: Verify attendance while maintaining participant anonymity
- Meeting Creation: Create meetings with custom parameters and privacy settings
- Real-time Statistics: View encrypted attendance statistics during active meetings
- Meeting Management: Create, manage, and end meetings with administrative controls
- Batch Processing: Handle multiple meetings and participants efficiently
- FHEVM Integration: On-chain participant verification ensures trust and integrity

### Privacy & Security

- Fully Encrypted Verification: All participant IDs remain encrypted throughout the meeting
- Zama FHE Technology: Industry-leading fully homomorphic encryption
- Blind Attendance Process: Participants cannot see others' identities during active meetings
- Post-Meeting Transparency: Full attendance revelation after meeting completion for verification
- Wallet Authentication: Secure access control through Ethereum wallets

## Architecture

### Smart Contracts

AnonymousCheckIn.sol - Main Meeting Contract

- Manages meeting creation, check-in, and termination using FHE operations
- Stores encrypted participant data on-chain during active meetings
- Provides automatic attendance verification
- Handles batch processing of multiple meetings
- Maintains pseudonymous participant identifiers for privacy

### Frontend Application

- React + TypeScript: Modern user interface with Web3 design theme
- Ethers.js: Blockchain interaction and wallet integration
- Vite: Fast build and hot reload development environment
- Wallet Integration: Connect various Ethereum wallets seamlessly
- Responsive Design: Optimized for desktop and mobile devices
- Real-time Updates: Instant reflection of new meetings and attendance
- Data Visualization: Interactive display of meeting statistics and results

## Technology Stack

### Blockchain

- Solidity ^0.8.24: Smart contract development
- Zama FHE: Fully Homomorphic Encryption library
- FHEVM: Fully Homomorphic Encryption Virtual Machine
- OpenZeppelin: Secure contract libraries for access control
- Hardhat: Development and deployment framework

### Frontend

- React 18 + TypeScript: Modern frontend framework
- Vite: Build tool and development server
- Ethers.js: Ethereum blockchain interaction
- Chart.js: Data visualization for meeting statistics
- React Icons: Comprehensive icon library
- Web3 UI Design: Modern decentralized application interface

### Infrastructure

- Vercel: Frontend deployment platform
- Sepolia Testnet: Ethereum test network for development

## Installation

### Prerequisites

- Node.js 18+ 
- npm / yarn / pnpm package manager
- Ethereum wallet (MetaMask, WalletConnect, etc.)

### Setup

```bash
# Clone the repository
git clone https://github.com/kqqdhrxd-society/zama-fhe-anonymousCheckIn.git
cd zama-fhe-anonymousCheckIn

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

- Connect Wallet: Click the "Connect Wallet" button and select your preferred Ethereum wallet
- Create Meeting: Click "New Meeting" to create a new meeting with details and privacy settings
- Check In Anonymously: Submit encrypted participant IDs that remain private
- Monitor Meetings: View active meetings with real-time encrypted statistics
- End Meeting: Meeting creators can terminate meetings to finalize attendance
- View Results: After completion, see attendance statistics and verification

## Security Features

- All participant data is encrypted using FHE during the meeting
- Individual identities remain hidden until meeting completion
- Only attendance statistics are revealed post-meeting
- Meeting results stored immutably on-chain for verification
- Transparent post-meeting attendance revelation ensures fairness

## Future Enhancements

- Advanced meeting types (private events, exclusive sessions)
- Multi-platform support for web and mobile check-ins
- Cross-chain deployment for broader accessibility
- Mobile application for on-the-go check-in
- Integration with calendar systems
- DAO governance for platform improvements

Built with ❤️ using Zama FHE Technology
// contract.ts
import { ethers } from "ethers";
import abiJson from "./abi/AnonymousCheckIn.json";
import configJson from "./config.json";

export const ABI = (abiJson as any).abi || abiJson;
export const config = configJson;

const SEPOLIA_CHAIN_ID = 11155111n; // Sepolia chainId in decimal
const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7"; // Sepolia chainId in hex

// Ensure provider is connected to Sepolia
export async function getProvider() {
  if ((window as any).ethereum) {
    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await browserProvider.getNetwork();

    // Check if user is already on Sepolia
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      console.warn(
        `⚠️ Wallet is on wrong network (chainId=${network.chainId}), switching to Sepolia...`
      );

      try {
        // Try to switch network
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
        });
      } catch (switchError: any) {
        // If Sepolia is not added in the wallet, add it
        if (switchError.code === 4902) {
          try {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: SEPOLIA_CHAIN_ID_HEX,
                  chainName: "Sepolia Test Network",
                  rpcUrls: [config.network],
                  nativeCurrency: {
                    name: "SepoliaETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
          } catch (addError) {
            throw new Error("User rejected adding Sepolia network");
          }
        } else {
          throw new Error("User rejected switching to Sepolia network");
        }
      }

      // After switching, create a new provider
      return new ethers.BrowserProvider((window as any).ethereum);
    }

    return browserProvider;
  }

  // Fallback: no injected wallet, use RPC from config.json
  return new ethers.JsonRpcProvider(config.network);
}

// Get a read-only contract (no signer, provider only)
export async function getContractReadOnly() {
  const provider = await getProvider();
  return new ethers.Contract(config.contractAddress, ABI, provider);
}

// Get a contract connected with signer (for write operations)
export async function getContractWithSigner() {
  if (!(window as any).ethereum) {
    throw new Error("No injected wallet found");
  }
  const provider = await getProvider();
  const signer = await (provider as ethers.BrowserProvider).getSigner();
  return new ethers.Contract(config.contractAddress, ABI, signer);
}

// Helper: normalize address to lowercase
export function normAddr(a: string) {
  return a ? a.toLowerCase() : a;
}

// contract.ts
import { ethers } from "ethers";
import abiJson from "./abi/AnonymousCheckIn.json";
import configJson from "./config.json";

export const ABI = (abiJson as any).abi || abiJson;
export const config = configJson;

const getTestnetProvider = () => {
  return new ethers.JsonRpcProvider(config.network);
};

// get a read-only contract (fixed to testnet)
export async function getContractReadOnly() {
  try {
    const provider = getTestnetProvider();
    const contract = new ethers.Contract(config.contractAddress, ABI, provider);
    
    const code = await provider.getCode(config.contractAddress);
    if (code === "0x") {
      console.error("Contract does not exist at address:", config.contractAddress);
      return null;
    }
    
    return contract;
  } catch (error) {
    console.error("Failed to create read-only contract:", error);
    return null;
  }
}

// get a contract connected to signer (for write operations)
export async function getContractWithSigner() {
  if (!(window as any).ethereum) {
    throw new Error("No injected wallet");
  }
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(config.contractAddress, ABI, signer);
    return contract;
  } catch (error) {
    console.error("Failed to create contract with signer:", error);
    throw error;
  }
}

// helper: format address lowercase
export function normAddr(a: string) { 
  return a ? a.toLowerCase() : a; 
}
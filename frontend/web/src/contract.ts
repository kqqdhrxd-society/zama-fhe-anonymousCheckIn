// contract.ts
import { ethers } from "ethers";
import abiJson from "./abi/AnonymousCheckIn.json";
import configJson from "./config.json";

export const ABI = (abiJson as any).abi || abiJson;
export const config = configJson;


const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (e) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw e;
  }
};

const getTestnetProvider = () => {
  return new ethers.JsonRpcProvider(config.network, {
    name: "sepolia",
    chainId: 11155111,
  });
};

// get a read-only contract (fixed to testnet)
export async function getContractReadOnly() {
  try {
    const provider = getTestnetProvider();
    const contract = new ethers.Contract(config.contractAddress, ABI, provider);
    
    const code = await retry(() => provider.getCode(config.contractAddress));
    if (code === "0x") {
      return null;
    }
    
    return contract;
  } catch (error) {
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
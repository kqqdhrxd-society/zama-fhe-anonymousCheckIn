// contract.ts
import { ethers } from "ethers";
import abiJson from "./abi/AnonymousCheckIn.json";
import configJson from "./config.json";

export const ABI = (abiJson as any).abi || abiJson;
export const config = configJson;

export async function getProvider() {

  if ((window as any).ethereum) {
    const p = new ethers.BrowserProvider((window as any).ethereum);
    return p;
  }

  return new ethers.JsonRpcProvider(config.network);
}

// get a read-only contract (provider based)
export async function getContractReadOnly() {
  try {
    const provider = await getProvider();
    const contract = new ethers.Contract(config.contractAddress, ABI, provider);
    return contract;
  } catch (error) {
    throw error;
  }
}

// get a contract connected to signer (for write)
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
    throw error;
  }
}

// helper: format address lowercase
export function normAddr(a: string) { 
  return a ? a.toLowerCase() : a; 
}
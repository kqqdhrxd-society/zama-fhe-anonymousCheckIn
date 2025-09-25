// deploy/deploy.ts
import fs from "fs";
import path from "path";
import readline from "readline";
import { ethers as hardhatEthers } from "hardhat";
import { Wallet, JsonRpcProvider } from "ethers";

async function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((resolve) =>
    rl.question(prompt, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  const privateKey = await ask("Enter the deployer private key (testnet only): ");
  let rpc = await ask("Enter the RPC URL (press Enter to use public Sepolia: https://sepolia.drpc.org): ");
  if (!rpc) rpc = "https://sepolia.drpc.org";

  const provider = new JsonRpcProvider(rpc);
  const wallet = new Wallet(privateKey, provider);

  console.log("Deployer account:", wallet.address);

  // Deploy the plain AnonymousCheckIn contract
  const AnonymousCheckInFactory = await hardhatEthers.getContractFactory("AnonymousCheckIn", wallet);
  const factory = await AnonymousCheckInFactory.deploy();
  await factory.waitForDeployment();

  const deployedAddress = (factory as any).target || (factory as any).address;
  console.log("AnonymousCheckIn contract deployed at:", deployedAddress);

  // Write config for the frontend
  const frontendConfigDir = path.join(__dirname, "..", "frontend", "web", "src");
  if (!fs.existsSync(frontendConfigDir)) {
    console.warn("Frontend src directory not found, skipping config.json write:", frontendConfigDir);
  } else {
    const config = {
      network: "https://sepolia.g.alchemy.com/v2/",
      contractAddress: deployedAddress,
      deployer: wallet.address,
    };
    fs.writeFileSync(
      path.join(frontendConfigDir, "config.json"),
      JSON.stringify(config, null, 2)
    );
    console.log("Wrote frontend config: frontend/web/src/config.json");

    // Copy ABI to the frontend
    try {
      const artifactPath = path.join(
        __dirname,
        "..",
        "artifacts",
        "contracts",
        "AnonymousCheckIn.sol",
        "AnonymousCheckIn.json"
      );
      const targetAbiPath = path.join(frontendConfigDir, "abi");
      if (!fs.existsSync(targetAbiPath)) fs.mkdirSync(targetAbiPath, { recursive: true });
      fs.copyFileSync(artifactPath, path.join(targetAbiPath, "AnonymousCheckIn.json"));
      console.log("Copied ABI to frontend/web/src/abi/AnonymousCheckIn.json");
    } catch (e) {
      console.warn(
        "Failed to copy ABI automatically. Please copy artifacts/.../AnonymousCheckIn.json manually to frontend/web/src/abi/AnonymousCheckIn.json",
        e
      );
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

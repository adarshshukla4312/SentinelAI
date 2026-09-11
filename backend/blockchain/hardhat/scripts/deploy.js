const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SentinelAuditAnchor with account:", deployer.address);

  const SentinelAuditAnchor = await hre.ethers.getContractFactory("SentinelAuditAnchor");
  const contract = await SentinelAuditAnchor.deploy(deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("SentinelAuditAnchor deployed to:", contractAddress);

  const artifact = await hre.artifacts.readArtifact("SentinelAuditAnchor");
  const deploymentData = {
    network: "Polygon Amoy testnet",
    chainId: 80002,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const outputPath = path.resolve(__dirname, "../../deployed.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log("Saved deployment artifact to:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

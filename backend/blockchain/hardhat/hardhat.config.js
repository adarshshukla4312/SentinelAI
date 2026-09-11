require("@nomicfoundation/hardhat-toolbox");

const POLYGON_AMOY_RPC = process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology";
const PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    amoy: {
      url: POLYGON_AMOY_RPC,
      accounts: [PRIVATE_KEY],
    },
  },
};

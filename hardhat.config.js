require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const NODEREAL_API_KEY = process.env.NODEREAL_API_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bsc: {
      url: "https://bsc-dataseed.binance.org",
      chainId: 56,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000, // 1 gwei
    },
    opbnb: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      chainId: 204,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
    opbnbTestnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org:8545",
      chainId: 5611,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  etherscan: {
    apiKey: {
      opbnb: NODEREAL_API_KEY,
    },
    customChains: [
      {
        network: "opbnb",
        chainId: 204,
        urls: {
          apiURL: `https://open-platform.nodereal.io/${NODEREAL_API_KEY}/op-bnb-mainnet/contract/`,
          browserURL: "https://opbnbscan.com/",
        },
      },
    ],
  },
};

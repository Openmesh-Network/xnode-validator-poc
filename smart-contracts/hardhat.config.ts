import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";

import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

const fakePrivKey = "0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1_000_000, // Higher is not allowed by Etherscan verification
      },
    },
  },
  networks: {
    mumbai: {
      accounts: [process.env.PRIV_KEY ?? fakePrivKey],
      url: process.env.RPC_MUMBAI ?? "https://rpc.ankr.com/polygon_mumbai",
      verify: {
        etherscan: {
          apiKey: process.env.X_POLYGONSCAN_API_KEY ?? "",
        },
      },
    },
    polygon: {
      accounts: [process.env.PRIV_KEY ?? fakePrivKey],
      url: process.env.RPC_POLYGON ?? "https://rpc.ankr.com/polygon",
      verify: {
        etherscan: {
          apiKey: process.env.X_POLYGONSCAN_API_KEY ?? "",
        },
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.X_ETHERSCAN_API_KEY ?? "",
      polygonMumbai: process.env.X_POLYGONSCAN_API_KEY ?? "",
    },
  },
};

export default config;
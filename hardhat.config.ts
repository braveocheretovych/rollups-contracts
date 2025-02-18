// (c) Cartesi and individual authors (see AUTHORS)
// SPDX-License-Identifier: Apache-2.0 (see LICENSE)

import path from "path";
import { HardhatUserConfig } from "hardhat/config";
import { HttpNetworkUserConfig } from "hardhat/types";
import { getSingletonFactoryInfo } from "@safe-global/safe-singleton-factory";

import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";

import {
    Chain,
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    mainnet,
    optimism,
    optimismSepolia,
    sepolia,
} from "viem/chains";

// read MNEMONIC from env variable
let mnemonic = process.env.MNEMONIC;

const ppath = (packageName: string, pathname: string) => {
    return path.join(
        path.dirname(require.resolve(`${packageName}/package.json`)),
        pathname,
    );
};

const networkConfig = (chain: Chain): HttpNetworkUserConfig => {
    let url = process.env.RPC_URL || chain.rpcUrls.default.http.at(0);

    // support for infura and alchemy URLs through env variables
    if (process.env.INFURA_ID && chain.rpcUrls.infura?.http) {
        url = `${chain.rpcUrls.infura.http}/${process.env.INFURA_ID}`;
    } else if (process.env.ALCHEMY_ID && chain.rpcUrls.alchemy?.http) {
        url = `${chain.rpcUrls.alchemy.http}/${process.env.ALCHEMY_ID}`;
    }

    return {
        chainId: chain.id,
        url,
        accounts: mnemonic ? { mnemonic } : undefined,
    };
};

const config: HardhatUserConfig = {
    networks: {
        hardhat: mnemonic ? { accounts: { mnemonic } } : {},
        localhost: {
            url: process.env.RPC_URL || "http://localhost:8545",
            accounts: mnemonic ? { mnemonic } : undefined,
        },
        arbitrum: networkConfig(arbitrum),
        arbitrum_sepolia: networkConfig(arbitrumSepolia),
        base: networkConfig(base),
        base_sepolia: networkConfig(baseSepolia),
        mainnet: networkConfig(mainnet),
        sepolia: networkConfig(sepolia),
        optimism: networkConfig(optimism),
        optimism_sepolia: networkConfig(optimismSepolia),
    },
    solidity: {
        version: "0.8.23",
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    paths: {
        artifacts: "artifacts",
        deploy: "deploy",
        deployments: "deployments",
    },
    deterministicDeployment: (network: string) => {
        // networks will use another deterministic deployment proxy
        // https://github.com/safe-global/safe-singleton-factory
        const chainId = parseInt(network);
        const info = getSingletonFactoryInfo(chainId);
        if (info) {
            return {
                factory: info.address,
                deployer: info.signerAddress,
                funding: (
                    BigInt(info.gasPrice) * BigInt(info.gasLimit)
                ).toString(),
                signedTx: info.transaction,
            };
        } else {
            console.warn(
                `unsupported deterministic deployment for network ${network}`,
            );
            return undefined;
        }
    },
    typechain: {
        outDir: "src/types",
        target: "ethers-v6",
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
        customChains: [
            {
                chainId: 421614,
                network: "arbitrum_sepolia",
                urls: {
                    apiURL: "https://api-sepolia.arbiscan.io/api",
                    browserURL: "https://sepolia.arbiscan.io",
                },
            },
            {
                chainId: 11155420,
                network: "optimism_sepolia",
                urls: {
                    apiURL: "https://sepolia-optimistic.etherscan.io/api",
                    browserURL: "https://sepolia-optimistic.etherscan.io",
                },
            },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
};

export default config;

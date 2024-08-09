export interface Network {
  chainId: string;
  name: string;
  graphql: string;
  networkID: string;
}

export const NETWORKS: Network[] = [
  {
    chainId: "testnet",
    name: "Devnet",
    graphql: "https://api.minascan.io/node/devnet/v1/graphql",
    networkID: "mina:testnet",
  },
  {
    chainId: "mainnet",
    name: "Mainnet",
    graphql: "https://api.minascan.io/node/mainnet/v1/graphql",
    networkID: "mina:mainnet",
  },
];

export const MAINNET_NETWORK: Network = {
  chainId: "mainnet",
  name: "Mainnet",
  graphql: "https://api.minascan.io/node/mainnet/v1/graphql",
  networkID: "mina:mainnet",
};

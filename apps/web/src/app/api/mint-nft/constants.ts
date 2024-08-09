export const CHAIN_NAME = (process.env.NEXT_PUBLIC_CHAIN || "devnet") as
  | "devnet"
  | "mainnet";

export const MINTER_PUBLIC_KEY = process.env.MINTER_PUBLIC_KEY || "";
export const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || "";
export const NFT_BUCKET_NAME = process.env.NFT_BUCKET_NAME || "builder_nfts";

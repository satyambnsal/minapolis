"use client";

import type { blockchain, MintParams } from "minanft";
import {
  pinFile,
  calculateSHA512,
  serializeTransaction,
  sendTransaction,
} from "./utils";
import type { VerificationKey } from "o1js";
import { CHAIN_NAME } from "./constants";

export interface ProofOfNFT {
  key: string;
  value: string;
  isPublic: boolean;
}


export async function mintNFT(params: {
  name: string;
  image: File;
  collection: string;
  description: string;
  price: number;
  keys: ProofOfNFT[];
  developer: string;
  repo: string;
}) {
  console.time("ready to sign");
  const { name, image, price, collection, description, keys, developer, repo } =
    params;

  const owner = await getAccount();
  if (owner === undefined) {
    console.error("Owner address is undefined");
    return;
  }

  if (name === undefined || name === "") {
    console.error("NFT name is undefined");
    return;
  }

  if (image === undefined) {
    console.error("Image is undefined");
    return;
  }

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (contractAddress === undefined) {
    console.error("Contract address is undefined");
    return;
  }

  const chain: blockchain = CHAIN_NAME;

  const ipfsPromise = pinFile({
    file: image,
    keyvalues: {
      name,
      owner,
      contractAddress,
      chain,
      developer,
      repo,
    },
  });

  console.time("imported o1js");
  const {
    Field,
    PrivateKey,
    PublicKey,
    UInt64,
    Mina,
    AccountUpdate,
    Signature,
    UInt32,
    VerificationKey,
  } = await import("o1js");
  console.timeEnd("imported o1js");
  console.time("imported minanft");
  const {
    MinaNFT,
    NameContractV2,
    RollupNFT,
    FileData,
    initBlockchain,
    MINANFT_NAME_SERVICE_V2,
    VERIFICATION_KEY_V2_JSON,
    wallet,
    fetchMinaAccount,
    api,
    serializeFields,
    MintParams,
  } = await import("minanft");
  console.timeEnd("imported minanft");
  console.time("prepared data");
  if (contractAddress !== MINANFT_NAME_SERVICE_V2) {
    console.error(
      "Contract address is not the same as MINANFT_NAME_SERVICE_V2"
    );
    return;
  }

  console.log("contractAddress", contractAddress);

  const nftPrivateKey = PrivateKey.random();
  const address = nftPrivateKey.toPublicKey();
  const net = await initBlockchain(chain);
  const sender = PublicKey.fromBase58(owner);
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT!;
  const arweaveKey = undefined;
  const jwt = process.env.NEXT_PUBLIC_MINANFT_JWT!;
  if (jwt === undefined) {
    console.error("JWT is undefined");
    return;
  }
  const minanft = new api(jwt);
  const reservedPromise = minanft.reserveName({
    name,
    publicKey: owner,
    chain: CHAIN_NAME,
    contract: contractAddress,
    version: "v2",
    developer: "Tileville",
    repo: "tileville",
  });

  const nft = new RollupNFT({
    name,
    address,
    external_url: net.network.explorerAccountUrl + address.toBase58(),
  });

  console.timeEnd("prepared data");

  if (pinataJWT === undefined) {
    console.error("pinataJWT is undefined");
    return;
  }

  if (collection !== undefined && collection !== "")
    nft.update({ key: `collection`, value: collection });

  if (description !== undefined && description !== "")
    nft.updateText({
      key: `description`,
      text: description,
    });

  for (const item of keys) {
    const { key, value, isPublic } = item;
    nft.update({ key, value, isPrivate: isPublic === false });
  }

  nft.update({ key: "rarity", value: "70%" });

  console.time("calculated sha3_512");
  const sha3_512 = await calculateSHA512(image);
  console.timeEnd("calculated sha3_512");
  console.log("image sha3_512", sha3_512);

  console.time("reserved name");
  const reserved = await reservedPromise;
  console.timeEnd("reserved name");

  console.log("Reserved", reserved);
  if (
    reserved === undefined ||
    reserved.isReserved !== true ||
    reserved.signature === undefined ||
    reserved.signature === "" ||
    reserved.price === undefined ||
    reserved.expiry === undefined ||
    (reserved.price as any)?.price === undefined
  ) {
    console.error("Name is not reserved");
    return {
      success: false,
      error: "Name is not reserved",
      reason: reserved.reason,
    };
  }

  const signature = Signature.fromBase58(reserved.signature);
  if (signature === undefined) {
    console.error("Signature is undefined");
    return;
  }

  const expiry = UInt32.from(BigInt(reserved.expiry));

  console.time("uploaded image");
  const ipfs = await ipfsPromise;
  console.timeEnd("uploaded image");
  console.log("image ipfs", ipfs);

  const imageData = new FileData({
    fileRoot: Field(0),
    height: 0,
    filename: image.name.substring(0, 30),
    size: image.size,
    mimeType: image.type.substring(0, 30),
    sha3_512,
    storage: `i:${ipfs}`,
  });

  nft.updateFileData({ key: `image`, type: "image", data: imageData });

  const commitPromise = nft.prepareCommitData({ pinataJWT });

  const zkAppAddress = PublicKey.fromBase58(MINANFT_NAME_SERVICE_V2);
  const zkApp = new NameContractV2(zkAppAddress);
  const fee = Number((await MinaNFT.fee()).toBigInt());
  const memo = "mint";
  await fetchMinaAccount({ publicKey: sender });
  await fetchMinaAccount({ publicKey: zkAppAddress });
  console.time("prepared commit data");
  await commitPromise;
  console.timeEnd("prepared commit data");
  console.time("prepared tx");

  if (nft.storage === undefined) throw new Error("Storage is undefined");
  if (nft.metadataRoot === undefined) throw new Error("Metadata is undefined");
  const json = JSON.stringify(
    nft.toJSON({
      includePrivateData: true,
    }),
    null,
    2
  );
  console.log("json", json);

  const verificationKey: VerificationKey = {
    hash: Field.fromJSON(VERIFICATION_KEY_V2_JSON[CHAIN_NAME].hash),
    data: VERIFICATION_KEY_V2_JSON[CHAIN_NAME].data,
  };
  const mintParams: MintParams = {
    name: MinaNFT.stringToField(nft.name!),
    address,
    owner: sender,
    price: UInt64.from(BigInt(price * 1e9)),
    fee: UInt64.from(BigInt((reserved.price as any)?.price * 1_000_000_000)),
    feeMaster: wallet,
    verificationKey,
    signature,
    expiry,
    metadataParams: {
      metadata: nft.metadataRoot,
      storage: nft.storage!,
    },
  };
  const tx = await Mina.transaction({ sender, fee, memo }, async () => {
    await zkApp.mint(mintParams);
  });

  tx.sign([nftPrivateKey]);
  const serializedTransaction = serializeTransaction(tx);
  const transaction = tx.toJSON();
  console.log("Transaction", tx.toPretty());
  const payload = {
    transaction,
    onlySign: true,
    feePayer: {
      fee: fee,
      memo: memo,
    },
  };
  console.timeEnd("prepared tx");
  console.timeEnd("ready to sign");
  const txResult = await (window as any).mina?.sendTransaction(payload);
  console.log("Transaction result", txResult);
  console.time("sent transaction");
  const signedData = txResult?.signedData;
  if (signedData === undefined) {
    console.log("No signed data");
    return undefined;
  }

  const sentTx = await sendTransaction({
    serializedTransaction,
    signedData,
    mintParams: serializeFields(MintParams.toFields(mintParams)),
    contractAddress,
    name,
  });
  console.timeEnd("sent transaction");
  console.log("Sent transaction", sentTx);
}

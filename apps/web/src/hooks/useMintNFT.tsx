"use client";

import type { blockchain, MintParams } from "minanft";
import {
  serializeTransaction,
  sendTransaction,
} from "@/app/api/mint-nft/client-utils";
import type { VerificationKey } from "o1js";
import {
  CHAIN_NAME,
  FEEMASTER_PUBLIC_KEY,
  MINANFT_CONTRACT_ADDRESS,
  RESERVED_PRICE_REDUCE_KEY,
  ProofOfNFT,
} from "@/app/api/mint-nft/constants";
import { createFileFromImageUrl } from "@/app/api/mint-nft/common-utils";
import { useSetAtom } from "jotai";
import { mintProgressAtom } from "@/contexts/atoms";

export type MintNFTParams = {
  name: string;
  signed_image_url: string;
  collection: string;
  description: string;
  price: number;
  keys: ProofOfNFT[];
  owner_address: string;
  ipfs: string;
  nft_id: number;
};

export function useMintNFT() {
  const setMintProgress = useSetAtom(mintProgressAtom);
  const mintMINANFTHelper = async (params: MintNFTParams) => {
    console.log("######## MINT NFT Flow Starts ######");
    console.log("params", params);
    const {
      name,
      price,
      collection,
      description,
      keys,
      ipfs,
      signed_image_url,
      nft_id,
    } = params;
    const contractAddress = MINANFT_CONTRACT_ADDRESS;
    const chain: blockchain = CHAIN_NAME;

    const image = await createFileFromImageUrl({
      image_url: signed_image_url,
      name: `${nft_id}.png`,
    });

    const owner = await getAccount();
    if (!owner) {
      return { sucess: false, message: "No account found" };
    }

    const { Field, PrivateKey, PublicKey, UInt64, Mina, Signature, UInt32 } =
      await import("o1js");
    console.log("imported o1js");
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
    console.log("imported minanft ");
    if (contractAddress !== MINANFT_NAME_SERVICE_V2) {
      console.error(
        "Contract address is not the same as MINANFT_NAME_SERVICE_V2"
      );
      return {
        sucess: false,
        message: "Contract address is not the same as MINANFT_NAME_SERVICE_V2",
      };
    }

    setMintProgress({
      step: 3,
      message: "Checking if the name is reserved or not",
    });

    const nftPrivateKey = PrivateKey.random();
    const address = nftPrivateKey.toPublicKey();
    const net = await initBlockchain(chain);
    const sender = PublicKey.fromBase58(owner);
    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT!;
    const jwt = process.env.NEXT_PUBLIC_MINANFT_JWT!;
    const minanft = new api(jwt);

    const reservedPromise = minanft.reserveName({
      name,
      publicKey: owner,
      chain: CHAIN_NAME,
      contract: contractAddress,
      version: "v2",
      developer: "Tileville",
      repo: "tileville",
      key: RESERVED_PRICE_REDUCE_KEY,
    } as any);

    const nft = new RollupNFT({
      name,
      address,
      external_url: net.network.explorerAccountUrl + address.toBase58(),
    });

    console.log("prepared data", nft);

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

    const sha3_512 = await calculateSHA512(image as File);
    const reserved = await reservedPromise;

    // console.log("Reserved name", reserved);
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
        message: "Name is not reserved",
        reason: reserved.reason,
      };
    }

    setMintProgress({
      step: 4,
      message: "Sending transaction",
    });

    const signature = Signature.fromBase58(reserved.signature);
    if (signature === undefined) {
      console.error("Signature is undefined");
      return {
        success: false,
        message: "reserved response signature is undefined",
      };
    }

    const expiry = UInt32.from(BigInt(reserved.expiry));

    const imageData = new FileData({
      fileRoot: Field(0),
      height: 0,
      filename: image!.name.substring(0, 30),
      size: image!.size,
      mimeType: image!.type.substring(0, 30),
      sha3_512,
      storage: `i:${ipfs}`,
    });

    nft.updateFileData({ key: `image`, type: "image", data: imageData });

    const commitPromise = nft.prepareCommitData({ pinataJWT });

    const zkAppAddress = PublicKey.fromBase58(MINANFT_NAME_SERVICE_V2);
    const zkApp = new NameContractV2(zkAppAddress);
    const fee = Number((await MinaNFT.fee()).toBigInt());
    const memo = ("mint NFT @" + name).substring(0, 30);
    await fetchMinaAccount({ publicKey: sender });
    await fetchMinaAccount({ publicKey: zkAppAddress });
    console.time("prepared commit data");
    await commitPromise;
    console.timeEnd("prepared commit data");
    console.time("prepared tx");
    const feeMaster = PublicKey.fromBase58(FEEMASTER_PUBLIC_KEY);

    if (nft.storage === undefined) {
      return {
        success: false,
        message: "nft storeage is undefined",
      };
    }
    if (nft.metadataRoot === undefined) {
      return {
        success: false,
        message: "nft metadata root is undefined",
      };
    }

    const json = JSON.stringify(
      nft.toJSON({
        includePrivateData: true,
      }),
      null,
      2
    );
    console.log("nft json", json);

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
      feeMaster: feeMaster,
      verificationKey,
      signature,
      expiry,
      metadataParams: {
        metadata: nft.metadataRoot,
        storage: nft.storage,
      },
    };
    console.log("mint params", mintParams);
    let tx: any;
    try {
      tx = await Mina.transaction({ sender, fee, memo }, async () => {
        await zkApp.mint(mintParams);
      });
    } catch (err) {
      console.log("transaction sign error", err);
    }
    console.log("mint transaction", tx);
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
    let txResult;
    function isErrorWithCode(error: unknown): error is { code: number } {
      return typeof error === "object" && error !== null && "code" in error;
    }
    try {
      txResult = await (window as any).mina?.sendTransaction(payload);
    } catch (error: unknown) {
      if (isErrorWithCode(error) && error.code === 1002) {
        console.log("transaction error 273", error);
        return {
          success: false,
          message: "You cancelled the transaction! Please try again",
        };
      }
      // Handle other types of errors
      console.error("An unexpected error occurred:", error);
      return {
        success: false,
        message: "An unexpected error occurred",
      };
    }
    console.log("Transaction result", txResult);
    console.time("sent transaction");
    setMintProgress({
      step: 5,
      message: "Minting NFT",
    });
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
    setMintProgress({
      step: 6,
      message: "NFT Minted",
    });

    if (sentTx.hash.toLocaleLowerCase().includes("error")) {
      return { success: false, message: sentTx.hash };
    }
    return { success: true, txHash: sentTx.hash };
  };

  return { mintMINANFTHelper };
}

export async function getAccount(): Promise<string | undefined> {
  const accounts = await (window as any)?.mina?.requestAccounts();
  let address: string | undefined = undefined;
  if (accounts?.code === undefined && accounts?.length > 0) {
    address = accounts[0];
    console.log("Address", address);
  }
  return address;
}

export async function calculateSHA512(file: File): Promise<string> {
  const readFileAsArrayBuffer = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return window.btoa(binary);
  };

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);

    const hashBuffer = await crypto.subtle.digest(
      "SHA-512",
      arrayBuffer as BufferSource
    );

    const hashBase64 = arrayBufferToBase64(hashBuffer);

    return hashBase64;
  } catch (error) {
    console.error("Error calculating SHA-512 hash:", error);
    throw error;
  }
}
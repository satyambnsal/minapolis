"use client";
import axios from "axios";
import { CHAIN_NAME, NFT_BUCKET_NAME } from "./constants";
import type { Mina } from "o1js";
import { supabaseServiceClient as supabase } from "@/db/config/server";

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

export async function pinFile(params: {
  file: File;
  keyvalues: { [key: string]: string };
}): Promise<string | undefined> {
  const { file, keyvalues } = params;
  try {
    const formData = new FormData();
    const metadata = {
      name: file.name,
      keyvalues: {
        ...keyvalues,
        mimeType: file.type,
        size: file.size.toString(),
        filename: file.name ?? "",
      },
    };
    formData.append("file", file);
    formData.append("pinataMetadata", JSON.stringify(metadata));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
    const endpoint = process.env.NEXT_PUBLIC_IPFS_URL;
    if (endpoint === undefined) throw new Error("IPFS URL is undefined");
    const key = process.env.NEXT_PUBLIC_PINATA_JWT;
    if (key === undefined) throw new Error("IPFS Key is undefined");
    const headers = {
      "Content-Type": `multipart/form-data`,
      Authorization: "Bearer " + key,
    };
    console.log("pinFile", { endpoint, key, metadata, headers, formData });

    const response = await axios.post(endpoint, formData, {
      maxBodyLength: Infinity,
      headers,
    });
    if (response?.data?.IpfsHash) {
      console.log("pinFile response", response.data);
      return response.data.IpfsHash;
    } else {
      console.error("pinFile error 1", response.data.error);
      return undefined;
    }
  } catch (err) {
    console.error("pinFile error 2 - catch", err);
    return undefined;
  }
}

export interface ProofOfNFT {
  key: string;
  value: string;
  isPublic: boolean;
}

export interface SimpleImageData {
  filename: string;
  size: number;
  mimeType: string;
  sha3_512: string;
  storage: string;
}
export interface SimpleMintNFT {
  contractAddress: string;
  chain: string;
  name: string;
  description: string;
  collection: string;
  price: number;
  owner: string;
  image: SimpleImageData;
  keys: ProofOfNFT[];
}

export async function sendTransaction(params: {
  serializedTransaction: string;
  signedData: string;
  mintParams: string;
  contractAddress: string;
  name: string;
}): Promise<{ isSent: boolean; hash: string }> {
  const {
    serializedTransaction,
    signedData,
    contractAddress,
    mintParams,
    name,
  } = params;
  console.log("sendTransaction", {
    serializedTransaction,
    signedData,
    contractAddress,
    mintParams,
  });

  const args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(
    {
      serializedTransaction,
      signedData,
      mintParams,
    },
    null,
    2
  );

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "mint",
    args,
    metadata: `mint NFT @${name}`,
    mode: "async",
  });

  console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer.jobId;
  console.log(`jobId:`, jobId);
  let result;
  while (result === undefined && answer.jobStatus !== "failed") {
    await sleep(5000);
    answer = await zkCloudWorkerRequest({
      command: "jobResult",
      jobId,
    });
    console.log(`jobResult api call result:`, answer);
    result = answer.result;
    if (result !== undefined) console.log(`jobResult result:`, result);
  }
  if (answer.jobStatus === "failed") {
    return { isSent: false, hash: result };
  } else if (result === undefined) {
    return { isSent: false, hash: "job error" };
  } else return { isSent: true, hash: result };
}

export async function prepareTransaction(params: SimpleMintNFT): Promise<{
  isPrepared: boolean;
  transaction?: string;
  fee?: number;
  memo?: string;
  serializedTransaction?: string;
  mintParams?: string;
}> {
  const { contractAddress } = params;
  console.log("sendSimpleMintCommand", params);

  const args = JSON.stringify({
    contractAddress,
  });

  const transaction = JSON.stringify(params, null, 2);

  let answer = await zkCloudWorkerRequest({
    command: "execute",
    transactions: [transaction],
    task: "prepare",
    args,
    metadata: `mint`,
    mode: "async",
  });

  console.log(`zkCloudWorker answer:`, answer);
  const jobId = answer.jobId;
  console.log(`jobId:`, jobId);
  let result;
  while (result === undefined && answer.jobStatus !== "failed") {
    await sleep(5000);
    answer = await zkCloudWorkerRequest({
      command: "jobResult",
      jobId,
    });
    console.log(`jobResult api call result:`, answer);
    result = answer.result;
    if (result !== undefined) console.log(`jobResult result:`, result);
  }
  if (answer.jobStatus === "failed") {
    return { isPrepared: false };
  } else if (result === undefined) {
    return { isPrepared: false };
  } else return { isPrepared: true, ...JSON.parse(result) };
}

async function zkCloudWorkerRequest(params: any) {
  const { command, task, transactions, args, metadata, mode, jobId } = params;
  const chain = CHAIN_NAME;
  if (chain === undefined) throw new Error("Chain is undefined");
  const apiData = {
    auth: process.env.NEXT_PUBLIC_ZKCW_AUTH,
    command: command,
    jwtToken: process.env.NEXT_PUBLIC_ZKCW_JWT,
    data: {
      task,
      transactions: transactions ?? [],
      args,
      repo: "mint-worker",
      developer: "DFST",
      metadata,
      mode: mode ?? "sync",
      jobId,
    },
    chain,
  };
  const endpoint = process.env.NEXT_PUBLIC_ZKCW_ENDPOINT + chain;

  const response = await axios.post(endpoint, apiData);
  return response.data;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function serializeTransaction(tx: any): string {
  const length = tx.transaction.accountUpdates.length;
  const blindingValues = [];
  for (let i = 0; i < length; i++) {
    const la = tx.transaction.accountUpdates[i].lazyAuthorization;
    if (
      la !== undefined &&
      la.blindingValue !== undefined &&
      la.kind === "lazy-proof"
    )
      blindingValues.push(la.blindingValue.toJSON());
    else blindingValues.push("");
  }
  const serializedTransaction = JSON.stringify(
    {
      tx: tx.toJSON(),
      blindingValues,
      length,
      fee: tx.transaction.feePayer.body.fee.toJSON(),
      sender: tx.transaction.feePayer.body.publicKey.toBase58(),
      nonce: tx.transaction.feePayer.body.nonce.toBigint().toString(),
    },
    null,
    2
  );
  return serializedTransaction;
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

export const fetchNFTImageUrl = async (nft_id: number) => {
  try {
    const { data, error } = await supabase.storage
      .from(NFT_BUCKET_NAME)
      .createSignedUrl(`${nft_id}.png`, 180); // 60 seconds expiry time
    if (error) {
      throw error;
    }
    return data.signedUrl;
  } catch (error: any) {
    console.error("Error fetching image:", error.message);
    return null;
  }
};

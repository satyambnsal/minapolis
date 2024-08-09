import { ACCOUNT_AUTH_MESSAGE } from "@/constants";

export async function getSignClient() {
  const { default: Client } = await import("mina-signer");
  const client = new Client({ network: "mainnet" });
  return client;
}

export async function signMessagePayment(privateKey: string, message: string) {
  let signedResult;
  try {
    const signClient = await getSignClient();
    signedResult = signClient.signMessage(message, privateKey);
  } catch (error) {
    signedResult = { error: { message } };
  }
  return signedResult;
}

export async function isSignatureValid(
  publicKey: string,
  signature: { field: string; scalar: string },
  verifyMessage: string
) {
  try {
    const signClient = await getSignClient();
    const verifyBody = {
      data: verifyMessage,
      publicKey,
      signature,
    };
    const verifyResult = signClient.verifyMessage(verifyBody);
    console.log("verification result", verifyResult, verifyBody);
    return verifyResult;
  } catch (error) {
    console.error(`Failed to verify message`, error);
    return false;
  }
}




export async function verifyUserAuthentication(
  authSignature: string | null,
  wallet_address: string
) {
  if (!authSignature || !wallet_address) {
    throw new Error(
      "Authentication failed: Missing AuthSignature or wallet_address"
    );
  }
  try {
    const [publicKey, scalar, field] = authSignature.split(" ");

    console.log({ publicKey, scalar, field });

    if (!publicKey || !scalar || !field) {
      throw new Error("Invalid Auth header. missing signature object");
    }

    const verificationResult = await isSignatureValid(
      wallet_address,
      { scalar, field },
      ACCOUNT_AUTH_MESSAGE
    );
    if (!verificationResult) {
      throw new Error("Signature message verification failed");
    }
    console.log("--== signature verification succeeded");
  } catch (error: any) {
    console.error("Authentication error:", error);
    throw new Error(`Signature message verification failed: ${error.message}`);
  }
}

import { NextRequest } from "next/server";
import { isSignatureValid } from "./utils";
import { ACCOUNT_AUTH_MESSAGE } from "@/constants";

type NextApiHandler = (
  req: NextRequest
) => void | Promise<void> | Promise<Response>;

export function withAuth(handler: NextApiHandler) {
  return async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const wallet_address = searchParams.get("wallet_address") || "";
      const authSignature = req.headers.get("Auth-Signature");

      console.log("===18", { wallet_address, authSignature });
      if (!authSignature) {
        return Response.json(
          {
            success: false,
            message: "Signature Verification failed. Missing Auth signature.",
          },
          { status: 401 }
        );
      }
      if (!wallet_address) {
        return Response.json(
          {
            success: false,
            message: "Signature Verification failed. Missing Wallet Address.",
          },
          { status: 401 }
        );
      }

      const [publicKey, scalar, field] = authSignature.split(" ");

      if (!publicKey || !scalar || !field) {
        return Response.json(
          {
            success: false,
            message:
              "Signature Verification failed. Missing public key, scalar, or field",
          },
          {
            status: 401,
          }
        );
      }

      const verificationResult = await isSignatureValid(
        wallet_address,
        { scalar, field },
        ACCOUNT_AUTH_MESSAGE
      );
      if (!verificationResult) {
        return Response.json(
          {
            success: false,
            message: "Signature Verification failed",
          },
          {
            status: 401,
          }
        );
      }
      return handler(req);
    } catch (error: any) {
      console.error("Authentication error:", error);
      return Response.json(
        {
          success: false,
          message: `${error.toString()}`,
        },
        { status: 401 }
      );
    }
  };
}

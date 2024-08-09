import { NextRequest } from "next/server";
import { verifyUserAuthentication } from "../utils";
import { fetchNFTImageUrl } from "./utils";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  console.log("payload", payload);
  const { wallet_address, nft_id, txn_hash } = payload;

  const authSignature = request.headers.get("Auth-Signature");

  try {
    await verifyUserAuthentication(authSignature, wallet_address);

    // check transaction status
    // check nft_id
    // fetch signed url

    //
    console.log("signature verification done");
    const image_url = fetchNFTImageUrl(nft_id);
    console.log(image_url);
  } catch (error) {}
  // let res = {};
  // if (isExist) {
  //   const { data, error } = await supabase
  //     .from("player_profile")
  //     .update(other_field)
  //     .eq("wallet_address", wallet_address)
  //     .single();
  //   if (error) {
  //     throw error;
  //   }
  //   res = data;
  // } else {
  //   const { data, error } = await supabase
  //     .from("player_profile")
  //     .insert(payload)
  //     .select("*")
  //     .single();
  //   if (error) {
  //     throw error;
  //   }
  //   res = data;
  // }
  // return Response.json(res);
}

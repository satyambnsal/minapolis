import { supabaseServiceClient as supabase } from "@/db/config/server";
import { NextRequest } from "next/server";
import { withAuth } from "../authMiddleware";

async function isProfileExist(wallet_address: string): Promise<boolean> {
  const { data } = await supabase
    .from("player_profile")
    .select("wallet_address")
    .eq("wallet_address", wallet_address)
    .single();

  if (data) return true;
  return false;
}

export const getHandler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const wallet_address = searchParams.get("wallet_address") || "";

  try {
    const { data, error } = await supabase
      .from("player_profile")
      .select("*")
      .eq("wallet_address", wallet_address)
      .single();

    if (error) throw error;
    return Response.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Error in GET route:", error);
    return Response.json({ error: error.message }, { status: 200 });
  }
};

export async function POST(request: NextRequest) {
  const payload = await request.json();
  console.log("payload", payload);
  const { wallet_address, ...other_field } = payload;
  const isExist = await isProfileExist(wallet_address);
  let res = {};
  if (isExist) {
    const { data, error } = await supabase
      .from("player_profile")
      .update(other_field)
      .eq("wallet_address", wallet_address)
      .single();
    if (error) {
      throw error;
    }
    res = data;
  } else {
    const { data, error } = await supabase
      .from("player_profile")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    res = data;
  }
  return Response.json(res);
}

export const GET = withAuth(getHandler);

import { NextRequest } from "next/server";
import { supabaseServiceClient as supabase } from "@/db/config/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const competition_key = searchParams.get("competition_key") || "";

  try {
    const { data: scoreEntries, error } = await supabase
      .from("game_scores")
      .select("*")
      .eq("competition_key", competition_key)
      .order("score", { ascending: false });

    const wallet_addresses =
      scoreEntries?.map(({ wallet_address }) => wallet_address) || [];

    const { data: gameScoreUsers = [], error: fetchUsernamesError } =
      await supabase
        .from("player_profile")
        .select("wallet_address,username")
        .in("wallet_address", wallet_addresses);

    const result = scoreEntries?.map((scoreEntry) => {
      const wallet_address = scoreEntry.wallet_address;
      const gameScoreUser = gameScoreUsers?.find(
        (gameScoreUser) => gameScoreUser.wallet_address === wallet_address
      );
      const username = gameScoreUser?.username || "";
      return { ...scoreEntry, username };
    });
    if (error) throw error;
    return Response.json(result);
  } catch (error: any) {
    console.error("Error in GET route:", error);
    return Response.json({ error: error.message }, { status: 401 });
  }
}

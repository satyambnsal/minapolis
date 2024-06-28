import { AppSupabaseClient, Table } from "@/types";
import { supabaseUserClientComponentClient } from "@/supabase-clients/supabaseUserClientComponentClient";
import { TransactionLog } from "@/lib/types";
import { isMockEnv } from "@/constants";
import { mockCompetition } from "./mock-data";

type PlayerProfile = {
  username: string;
};

async function isProfileExist(
  supabase: AppSupabaseClient,
  wallet_address: string
): Promise<boolean> {
  const { data } = await supabase
    .from("player_profile")
    .select("wallet_address")
    .eq("wallet_address", wallet_address)
    .single();

  if (data) return true;
  return false;
}

export async function isUsernameExist(
  username: string,
  userId?: number
): Promise<boolean> {
  const supabase = supabaseUserClientComponentClient;
  let query = supabase
    .from("player_profile")
    .select("id")
    .eq("username", username);
  if (userId) {
    query = query.neq("id", userId);
  }
  const { data } = await query.single();

  return !!data;
}

export const getAllLeaderboardEntries = async (
  supabase: AppSupabaseClient
): Promise<Array<Table<"game_scores">>> => {
  const { data, error } = await supabase
    .from("game_scores")
    .select("*")
    .order("score", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const getAllCompetitionsEntries = async (
  supabase: AppSupabaseClient
): Promise<Array<Table<"tileville_competitions">>> => {
  const { data, error } = await supabase
    .from("tileville_competitions")
    .select("*")
    .order("priority");
  console.log("competition data", data);
  const formattedData = data ?? [];

  if (isMockEnv) {
    formattedData.push(mockCompetition);
  }
  if (error) {
    throw error;
  }
  return formattedData;
};

export const saveGameScoreDb = async (
  supabase: AppSupabaseClient,
  item: {
    competition_key: string;
    game_id: number;
    score: number;
    wallet_address: string;
  }
): Promise<Table<"game_scores">> => {
  let isExist = false;

  try {
    const { data } = await supabase
      .from("game_scores")
      .select("game_id")
      .eq("game_id", item.game_id)
      .single();
    isExist = !!data;
  } catch (error) {
    console.log("failed to check existing game");
  }

  if (!isExist) {
    const { data, error } = await supabase
      .from("game_scores")
      .insert(item)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    return data;
  }
  const { data, error } = await supabase
    .from("game_scores")
    .update({ score: item.score })
    .eq("game_id", item.game_id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const insertEmail = async (
  supabase: AppSupabaseClient,
  item: { name: string; email: string }
): Promise<Table<"signup_emails">> => {
  const { data, error } = await supabase
    .from("signup_emails")
    .insert(item)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getAllCompetitionsNames = async (
  supabase: AppSupabaseClient
): Promise<Array<{ id: number; name: string; unique_keyname: string }>> => {
  const { data, error } = await supabase
    .from("tileville_competitions")
    .select("id, name, unique_keyname");

  if (error) {
    throw error;
  }

  return data;
};

export const addTransactionLog = async (
  transaction: TransactionLog
): Promise<Table<"transaction_logs">> => {
  const supabase = supabaseUserClientComponentClient;
  const { data, error } = await supabase
    .from("transaction_logs")
    .insert(transaction)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
};

export const updateTransactionLog = async (
  txn_hash: string,
  update_payload: { txn_status: string }
): Promise<Table<"transaction_logs">> => {
  const supabase = supabaseUserClientComponentClient;

  const { data, error } = await supabase
    .from("transaction_logs")
    .update(update_payload)
    .eq("txn_hash", txn_hash)
    .single();

  if (error) {
    throw error;
  }
  return data;
};

export const fetchTransactions = async (
  wallet_address: string,
  txn_status: string
): Promise<Array<Table<"transaction_logs">>> => {
  const supabase = supabaseUserClientComponentClient;

  const { data, error } = await supabase
    .from("transaction_logs")
    .select("*")
    .eq("wallet_address", wallet_address)
    .eq("txn_status", txn_status);

  if (error) {
    throw error;
  }

  return data;
};

export const fetchTransactionLogById = async (
  wallet_address: string,
  id: number
): Promise<Table<"transaction_logs">> => {
  const supabase = supabaseUserClientComponentClient;
  const { data, error } = await supabase
    .from("transaction_logs")
    .select("*")
    .eq("wallet_address", wallet_address)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};

export const getFilteredLeaderboardEntries = async (
  competition_key: string
): Promise<Array<Table<"game_scores">>> => {
  const supabase = supabaseUserClientComponentClient;
  const { data, error } = await supabase
    .from("game_scores")
    .select("*")
    .eq("competition_key", competition_key)
    .order("score", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const getUsername = async (
  wallet_address: string
): Promise<PlayerProfile[]> => {
  const supabase = supabaseUserClientComponentClient;
  const { data, error } = await supabase
    .from("player_profile")
    .select("username")
    .eq("wallet_address", wallet_address);

  if (error) {
    throw error;
  }

  return data as PlayerProfile[];
};

export const fetchAllTransactionsByWallet = async (
  supabase: AppSupabaseClient,
  wallet_address: string
): Promise<Array<Table<"transaction_logs">>> => {
  const { data, error } = await supabase
    .from("transaction_logs")
    .select("*")
    .eq("wallet_address", wallet_address)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
};

export const getFilteredTransactionByStatus = async (
  supabase: AppSupabaseClient,
  wallet_address: string,
  txn_status: string
): Promise<Array<Table<"transaction_logs">>> => {
  if (txn_status !== "ALL") {
    const { data, error } = await supabase
      .from("transaction_logs")
      .select("*")
      .eq("wallet_address", wallet_address)
      .eq("txn_status", txn_status)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from("transaction_logs")
      .select("*")
      .eq("wallet_address", wallet_address)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return data;
  }
};

export const getPastGames = async (
  wallet_address: string
): Promise<Array<Table<"game_scores">>> => {
  const supabase = supabaseUserClientComponentClient;

  const { data, error } = await supabase
    .from("game_scores")
    .select("*")
    .eq("wallet_address", wallet_address)
    .order("created_at", { ascending: false })
    .order("score", { ascending: false });

  console.log("past games data", data);
  if (error) {
    throw error;
  }

  return data;
};

export const getActiveGames = async (
  supabase: AppSupabaseClient,
  wallet_address: string
): Promise<Array<Table<"transaction_logs">>> => {
  //TODO: Use filter method for a single query
  const txnLogsPromise = await supabase
    .from("transaction_logs")
    .select("*")
    .eq("wallet_address", wallet_address)
    .eq("txn_status", "CONFIRMED")
    .order("created_at", { ascending: false });

  const gameScoresPromise = await supabase
    .from("game_scores")
    .select("game_id")
    .eq("wallet_address", wallet_address);

  const [
    { data: gameTxnLogs, error: gameTxnLogsError },
    { data: gameScoreIds, error: gameScoreError },
  ] = await Promise.all([txnLogsPromise, gameScoresPromise]);
  if (gameTxnLogsError) {
    throw gameTxnLogsError;
  }
  if (gameScoreError) {
    throw gameScoreError;
  }
  const existingGameIds = gameScoreIds?.map(({ game_id }) => game_id) || [];
  const activeGames = (gameTxnLogs ?? []).filter(
    ({ id }) => !existingGameIds.includes(id)
  );
  console.log({ gameTxnLogs, gameScoreIds });
  return activeGames;
};


export const getCompetitionByKey = async (
  supabase: AppSupabaseClient,
  unique_keyname: string
): Promise<Table<"tileville_competitions">> => {
  const { data, error } = await supabase
    .from("tileville_competitions")
    .select("*")
    .eq("unique_keyname", unique_keyname)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const anonymousSignIn = async ({
  wallet_address,
}: {
  wallet_address: string;
}) => {
  const supabase = supabaseUserClientComponentClient;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.log("sign in error", error);
    // throw error;
  }
  console.log("anonymous sign in succeeded");
  return data;
};

/* ==================== */
/* AUTH */
/* ==================== */

import { supabaseUserClientComponentClient } from "@/supabase-clients/supabaseUserClientComponentClient";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import toast from "react-hot-toast";
import {
  getAllLeaderboardEntries,
  insertEmail,
  getAllCompetitionsEntries,
  getAllCompetitionsNames,
  getFilteredLeaderboardEntries,
  fetchTransactionLogById,
  updateTransactionLog,
  getFilteredTransactionByStatus,
  getPastGames,
  saveGameScoreDb,
  getActiveGames,
  fetchTransactions,
  getCompetitionByKey,
  isGameAlreadyPlayed,
  fetchGlobalConfig,
  getAllNFTsEntries,
} from "./supabase-queries";
import {
  ACCOUNT_AUTH_LOCALSTORAGE_KEY,
  BLOCKBERRY_API_KEY,
  BLOCKBERRY_MAINNET_BASE_URL,
} from "@/constants";
import { useAtom } from "jotai";
import { globalConfigAtom } from "@/contexts/atoms";
import { useLocalStorage } from "react-use";
// import { useAuthSignature } from "@/hooks/useAuthSignature";

export const useSendEmail = ({
  onSuccess,
  onMutate,
  onError,
}: {
  onSuccess?: () => void;
  onMutate?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const toastRef = useRef<string | null>(null);
  return useMutation(
    async ({ email, name }: { email: string; name: string }) => {
      return insertEmail(supabaseUserClientComponentClient, { name, email });
    },
    {
      onMutate: () => {
        // toastRef.current = toast.loading('');
        onMutate?.();
      },
      onSuccess: () => {
        toast.success(
          "You will receive an email before 12 hours when Minting Starts",
          {
            id: toastRef.current ?? undefined,
          }
        );

        toastRef.current = null;
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(String(error), {
          id: toastRef.current ?? undefined,
        });
        toastRef.current = null;
        onError?.(error);
      },
    }
  );
};

export const useSaveScore = ({
  // onSuccess,
  onMutate,
  onError,
}: {
  onSuccess?: () => void;
  onMutate?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const toastRef = useRef<string | null>(null);

  return useMutation(
    async (item: {
      competition_key: string;
      game_id: number;
      score: number;
      wallet_address: string;
    }) => {
      return saveGameScoreDb(supabaseUserClientComponentClient, item);
    },
    {
      onMutate: () => {
        // Optional: Uncomment the line below to show a loading toast
        // toastRef.current = toast.loading('Saving leaderboard data...');
        onMutate?.();
      },
      // onSuccess: () => {},
      onError: (error) => {
        toast.error(String(error), {
          id: toastRef.current ?? undefined,
        });
        toastRef.current = null;
        onError?.(error);
      },
      retry: 3,
    }
  );
};

export const useProfile = ({
  onSuccess,
  onMutate,
  onError,
}: {
  onSuccess?: () => void;
  onMutate?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const toastRef = useRef<string | null>(null);
  return useMutation(
    async (item: {
      wallet_address: string;
      username: string;
      fullname: string;
      avatar_url: string;
    }) => {
      return fetch("/api/player_profile", {
        method: "POST",
        body: JSON.stringify(item),
      }).then((res) => res.json());
    },
    {
      onMutate: () => {
        // Optional: Uncomment the line below to show a loading toast
        // toastRef.current = toast.loading('Saving leaderboard data...');
        onMutate?.();
      },
      onSuccess: () => {
        toast.success("profile data saved successfully", {
          id: toastRef.current ?? undefined,
        });

        toastRef.current = null;
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(String(error), {
          id: toastRef.current ?? undefined,
        });
        toastRef.current = null;
        onError?.(error);
      },
    }
  );
};

export const useLeaderboardData = () => {
  return useQuery(
    ["leaderboard"],
    () => getAllLeaderboardEntries(supabaseUserClientComponentClient),
    {}
  );
};

export const useCompetitionsData = () => {
  return useQuery(
    ["tileville_competitions"],
    () => getAllCompetitionsEntries(supabaseUserClientComponentClient),
    {}
  );
};

export const useNFTEntries = ({
  sortOrder = "desc",
  searchTerm,
  currentPage,
}: {
  sortOrder: "asc" | "desc";
  searchTerm: string;
  currentPage: number;
}) => {
  return useQuery(
    ["tileville_builder_nfts", sortOrder, searchTerm, currentPage],
    () => getAllNFTsEntries({ sortOrder, searchTerm, currentPage }),
    {}
  );
};
export const useProfileLazyQuery = (walletAddress: string) => {
  const [authSignature] = useLocalStorage(ACCOUNT_AUTH_LOCALSTORAGE_KEY);
  return useQuery({
    queryKey: ["user_profile", walletAddress],
    queryFn: async () => {
      if (!authSignature) {
        console.warn("Auth signature missing in storage");
        return;
      }
      return fetch(`/api/player_profile?wallet_address=${walletAddress}`, {
        headers: {
          "Auth-Signature": JSON.stringify(authSignature as string | ""),
        },
      })
        .then((res) => res.json())
        .catch((e) => {
          console.error(e);
        });
    },
  });
};

export const useCompetitionsName = () => {
  return useQuery(
    ["tileville_competitions_name"],
    () => getAllCompetitionsNames(supabaseUserClientComponentClient),
    {}
  );
};

export const useFilteredLeaderboardData = (competition_key: string) => {
  return useQuery(
    ["leaderboard", competition_key],
    () => getFilteredLeaderboardEntries(competition_key),
    {
      enabled: !!competition_key, // Only run this query if competitionId is not null
    }
  );
};

export const useMainnetTransactionsStatus = (
  txns: { txn_hash: string; txn_status: string }[]
) => {
  return useQueries({
    queries: txns.map(({ txn_hash, txn_status }) => ({
      queryKey: ["transaction_status_mainnet", txn_hash, txn_status],
      queryFn: () =>
        fetch(
          `${BLOCKBERRY_MAINNET_BASE_URL}/v1/block-confirmation/${txn_hash}`,
          {
            headers: {
              "x-api-key": BLOCKBERRY_API_KEY,
            },
          }
        )
          .then((response) => response.json())
          .then((res) => {
            console.log("blockberry api response");
            if (
              res.blockConfirmationsCount >= 1 ||
              res.txStatus === "applied"
            ) {
              return updateTransactionLog(txn_hash, {
                txn_status: "CONFIRMED",
              });
            }
          }),
      staleTime: Infinity,
      enabled: !!txn_hash && txn_status === "PENDING",
      retry: 5,
    })),
  });
};

export const useMainnetTransactionStatus = (
  txn_hash: string,
  txn_status: string
) => {
  return useQuery(
    ["transaction_status_mainnet", txn_hash],
    () =>
      fetch(
        `${BLOCKBERRY_MAINNET_BASE_URL}/v1/block-confirmation/${txn_hash}`,
        {
          headers: {
            "x-api-key": BLOCKBERRY_API_KEY,
          },
        }
      )
        .then((response) => response.json())
        .then((res) => {
          if (res.blockConfirmationsCount >= 1 || res.txStatus === "applied") {
            return updateTransactionLog(txn_hash, {
              txn_status: "CONFIRMED",
            });
          }
        }),
    {
      enabled: !!txn_hash && txn_status === "PENDING",
      retry: 5,
    }
  );
};

export const useTransactionLogById = (wallet_address: string, id: number) => {
  return useQuery(
    ["transaction_log_by_id", wallet_address, id],
    () => fetchTransactionLogById(wallet_address, id),
    {
      enabled: !!wallet_address && !!id,
    }
  );
};

export const useTransactionLogByStatus = (
  wallet_address: string,
  txn_status: string
) => {
  return useQuery(
    ["transactions", wallet_address, txn_status],
    () =>
      getFilteredTransactionByStatus(
        supabaseUserClientComponentClient,
        wallet_address,
        txn_status
      ),
    {
      enabled: !!txn_status && !!wallet_address,
    }
  );
};

export const useActiveGames = (wallet_address: string) => {
  return useQuery(
    ["active_games", wallet_address],
    () => getActiveGames(supabaseUserClientComponentClient, wallet_address),
    {
      enabled: !!wallet_address,
    }
  );
};

export const usePastGames = (wallet_address: string) => {
  return useQuery(
    ["past_games", wallet_address],
    () => getPastGames(wallet_address),
    {
      enabled: !!wallet_address,
    }
  );
};

export const useFetchTransactions = (
  wallet_address: string,
  txn_status: string
) => {
  return useQuery(
    ["transactions", wallet_address, txn_status],
    () => fetchTransactions(wallet_address, txn_status),
    {
      enabled: !!wallet_address && !!txn_status,
    }
  );
};

export const useCompetitionByKey = (unique_keyname: string) => {
  return useQuery(
    ["tileville_competition", unique_keyname],
    () =>
      getCompetitionByKey(supabaseUserClientComponentClient, unique_keyname),
    {
      enabled: unique_keyname.length > 0,
    }
  );
};

export const useIsGameAlreadyPlayed = (game_id: number) => {
  return useQuery(
    ["game_already_played", game_id],
    () => isGameAlreadyPlayed(game_id),
    {
      enabled: game_id > 0,
    }
  );
};

export const useGlobalConfig = (config_name: string) => {
  const [globalConfig, setGlobalConfig] = useAtom(globalConfigAtom);
  return useQuery(["global_config", config_name], () =>
    fetchGlobalConfig(config_name)
      .then((response) => {
        const config = response.config_values as { [key: string]: any };
        setGlobalConfig({ ...globalConfig, ...config });
        return response;
      })
      .catch((error) => {
        console.error(`Failed to fetch global config from db`, error);
      })
  );
};

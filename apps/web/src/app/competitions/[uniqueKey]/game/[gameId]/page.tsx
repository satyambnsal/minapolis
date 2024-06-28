"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import LandingBackground from "@/components/LandingBackground";
import { useParams } from "next/navigation";
import {
  useCompetitionByKey,
  useIsGameAlreadyPlayed,
  useMainnetTransactionStatus,
  useTransactionLogById,
} from "@/db/react-query-hooks";
import { useNetworkStore } from "@/lib/stores/network";
import { COMPETITION_SCORE_TWEET_DEFAULT_CONTENT } from "@/constants";

const GAMEPLAY_DISALLOW_MESSAGE_DEFAULT =
  "We are fetching your participation fee payment transaction details...";
const PhaserLayer = dynamic(() => import("@/phaser/phaserLayer"), {
  ssr: false,
});

function Game() {
  const params = useParams<{
    uniqueKey: string;
    gameId: string;
  }>();
  const [isGamePlayAllowed, setIsGamePlayAllowed] = useState(false);
  const [gamePlayDisAllowMessage, setGamePlayDisallowMessage] = useState(
    GAMEPLAY_DISALLOW_MESSAGE_DEFAULT
  );

  const networkStore = useNetworkStore();
  const {
    data: gameTransaction,
    error: gameTransactionError,
    isSuccess,
  } = useTransactionLogById(networkStore.address!, parseInt(params.gameId));
  const {
    data: isGameAlreadyPlayed = true,
    isSuccess: isGameAlreadyPlayedRespSuccess,
  } = useIsGameAlreadyPlayed(parseInt(params.gameId));
  const {
    data: competitionData,
    error: competitionError,
    isSuccess: isCompetitionSuccess,
  } = useCompetitionByKey(params.uniqueKey);

  console.log("game txn data", { gameTransaction, gameTransactionError });
  useMainnetTransactionStatus(
    gameTransaction?.txn_hash || "",
    gameTransaction?.txn_status || "PENDING"
  );
  console.log({ isGameAlreadyPlayed });
  useEffect(() => {
    if (isGameAlreadyPlayedRespSuccess && isGameAlreadyPlayed) {
      setGamePlayDisallowMessage(
        "You have already played the game. Please check your game status in user profile section."
      );
    } else if (gameTransaction?.txn_status === "FAILED") {
      setGamePlayDisallowMessage(
        "Transaction failed. you are not part of the competition"
      );
    } else if (gameTransaction && gameTransaction.txn_status === "CONFIRMED") {
      setIsGamePlayAllowed(true);
      setGamePlayDisallowMessage("");
    }
  }, [
    isSuccess,
    gameTransaction,
    isCompetitionSuccess,
    competitionData,
    isGameAlreadyPlayed,
    isGameAlreadyPlayedRespSuccess,
  ]);
  // console.log(txnStatusData, isLoading, isError);

  //TODO: fetch transaction status from game id

  return (
    <div className="gradient-bg gradient-bg h-[calc(100vh-80px)]">
      <LandingBackground />
      <div className="relative z-10">
        <div className="mb-0 w-full">
          <PhaserLayer
            isDemoGame={false}
            isGamePlayAllowed={isGamePlayAllowed}
            gamePlayDisAllowMessage={gamePlayDisAllowMessage}
            competitionKey={params.uniqueKey}
            gameId={+params.gameId}
            txnHash={gameTransaction?.txn_hash}
            txnStatus={gameTransaction?.txn_status}
            scoreTweetContent={
              competitionData?.score_tweet_content ||
              COMPETITION_SCORE_TWEET_DEFAULT_CONTENT
            }
          />
          <Toaster />
        </div>
      </div>
    </div>
  );
}

export default Game;

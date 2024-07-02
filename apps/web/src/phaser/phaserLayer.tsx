"use client";
import { useCallback, useEffect, useState } from "react";
import { LoadScene, MainScene, MenuScene } from "./scenes";
import { useSaveScore } from "@/db/react-query-hooks";
import { useNetworkStore } from "@/lib/stores/network";
import { GameInfoModal } from "@/components/GameInfoModal";
import toast from "react-hot-toast";

type PhaserLayerProps = {
  isDemoGame: boolean;
  isGamePlayAllowed: boolean;
  gamePlayDisAllowMessage: string;
  competitionKey: string;
  gameId: number;
  txnHash?: string | undefined;
  txnStatus?: string | undefined;
  scoreTweetContent: string;
};

export const PhaserLayer = ({
  isDemoGame,
  isGamePlayAllowed,
  gamePlayDisAllowMessage,
  competitionKey,
  gameId,
  txnHash,
  txnStatus,
  scoreTweetContent,
}: PhaserLayerProps) => {
  const { address } = useNetworkStore();
  const [showGameInfoModal, setShowGameInfoModal] = useState(false);
  const [isTimerGame, setIsTimerGame] = useState(true);
  console.log("address", address);

  const leaderboardMutation = useSaveScore({
    onSuccess: () => {
      console.log("Game score saved Successfully!");
    },
    onMutate: () => {
      console.log("Saving game score");
    },
    onError: (error) => {
      console.error("Error saving game score", error);
    },
  });
  const showGameInfoModalFn = useCallback(() => {
    setShowGameInfoModal(true);
  }, []);
  const handleSaveScore = useCallback(
    (score: number) => {
      if (isDemoGame) {
        return;
      }
      if (!address) {
        toast.error(
          `Seems there is some issue with wallet connection. Do not play the game as this will not be saved.`
        );
        return;
      }

      leaderboardMutation.mutate({
        competition_key: competitionKey,
        game_id: gameId,
        score: score,
        wallet_address: address,
      });
    },
    [leaderboardMutation, address, isDemoGame]
  );
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      width: 1280,
      height: "100%",
      parent: "minapolis-hex",
      type: Phaser.AUTO,
      scene: [LoadScene, MenuScene, MainScene],
      // scale: {
      //   autoCenter: Phaser.Scale.CENTER_BOTH,
      // },
      transparent: true,
    };
    const game = new Phaser.Game(config);
    game.registry.set("isDemoGame", isDemoGame);
    game.registry.set("handleSaveScore", handleSaveScore);
    game.registry.set("isGamePlayAllowed", isGamePlayAllowed);
    game.registry.set("gamePlayDisAllowMessage", gamePlayDisAllowMessage);
    game.registry.set("showGameInfoModalFn", showGameInfoModalFn);
    game.registry.set("competitionKey", competitionKey);
    game.registry.set("scoreTweetContent", scoreTweetContent);
    game.registry.set("isTimerGame", isTimerGame);
    return () => {
      game.destroy(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGamePlayAllowed, gamePlayDisAllowMessage]);

  return (
    <>
      <div id="minapolis-hex" className="min-h-[850px]" />
      <GameInfoModal
        open={showGameInfoModal}
        message={gamePlayDisAllowMessage}
        title="Transaction is pending!"
        txnHash={txnHash}
        txnStatus={txnStatus}
        handleClose={() => {
          setShowGameInfoModal(false);
        }}
      />
    </>
  );
};

export default PhaserLayer;

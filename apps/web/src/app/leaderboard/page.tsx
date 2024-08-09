"use client";
import { useState } from "react";
import Image from "next/image";
import { Table, DropdownMenu } from "@radix-ui/themes";
import {
  useCompetitionsName,
  useLeaderboardEntries,
} from "@/db/react-query-hooks";
import TableSkeleton from "./tableSkeleton";

type SelectedCompetition = {
  id: number;
  name: string;
  competition_key: string;
};
type LeaderboardResult = {
  competition_key: string;
  created_at: string;
  game_id: number;
  username: string;
  id: number;
  score: number;
  wallet_address: string;
};

export default function Leaderboard() {
  const {
    data: competitionData,
    isError: isCompetitionError,
    error: competitionError,
  } = useCompetitionsName();

  const [selectedCompetition, setSelectedCompetition] =
    useState<SelectedCompetition>({
      id: 3,
      name: "Hero's Tileville League",
      competition_key: "heros_tileville",
    } as SelectedCompetition);

  const { data: leaderboardData = [], isLoading } = useLeaderboardEntries(
    selectedCompetition.competition_key
  );

  if (isCompetitionError) {
    return (
      <div className="p-30">
        Error: {(competitionError as { message: string }).message}
      </div>
    );
  }

  return (
    <div className="p-4 py-40">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p>Select Competitions:</p>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <button className="border-primary-30 flex h-10 min-w-[224px] items-center justify-between rounded-md border bg-transparent px-3 font-semibold text-primary outline-none">
                  <span>{selectedCompetition.name}</span>
                  <span>
                    <Image
                      src="icons/topBottomArrows.svg"
                      width={24}
                      height={24}
                      alt="arrows"
                    />
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="min-w-[224px] !bg-transparent backdrop-blur-2xl">
                {competitionData?.map((competition) => (
                  <DropdownMenu.Item
                    key={competition.id}
                    onClick={() => {
                      setSelectedCompetition({
                        id: competition.id,
                        competition_key: competition.unique_keyname,
                        name: competition.name,
                      });
                    }}
                    className="hover:bg-primary"
                  >
                    {competition.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Rank</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Username</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Wallet Address</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Game Id</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <>
                {leaderboardData.map(
                  (entry: LeaderboardResult, index: number) => (
                    <Table.Row key={entry.id}>
                      <Table.Cell>{index + 1}</Table.Cell>
                      <Table.Cell>
                        {entry.username ? (
                          entry.username
                        ) : (
                          <span className="ps-4">-</span>
                        )}
                      </Table.Cell>
                      <Table.RowHeaderCell>
                        {entry.wallet_address}
                      </Table.RowHeaderCell>
                      <Table.Cell>{entry.game_id}</Table.Cell>
                      <Table.Cell>{entry.score}</Table.Cell>
                    </Table.Row>
                  )
                )}
              </>
            )}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  );
}

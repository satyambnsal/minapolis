"use client";
import { useCompetitionsName } from "@/db/react-query-hooks";
import {
  getFilteredLeaderboardEntries,
  getUsername,
} from "@/db/supabase-queries";
import { Skeleton, Table } from "@radix-ui/themes";
import { DropdownMenu } from "@radix-ui/themes";
import Image from "next/image";
import { useState, useEffect } from "react";
import TableSkeleton from "./tableSkeleton";

type SelectedCompetition = { id: number; name: string };
type LeaderboardResult = {
  competition_id: number;
  created_at: string;
  game_id: number;
  id: number;
  score: number;
  wallet_address: string;
};

export default function Leaderboard() {
  const {
    data: competitionData,
    isLoading: competitionLoading,
    isError: IsCompetitionError,
    error: competitionError,
  } = useCompetitionsName();

  const [selectedCompetition, setSelectedCompetition] =
    useState<SelectedCompetition>({
      id: 2,
      name: "Default Competition",
    } as SelectedCompetition);

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResult[]>(
    []
  );
  const [usernames, setUsernames] = useState<{
    [walletAddress: string]: string;
  }>({});

  useEffect(() => {
    if (selectedCompetition.id) {
      getFilteredLeaderboardEntries(selectedCompetition.id)
        .then(async (leaderboardEntries) => {
          setLeaderboardData(leaderboardEntries);

          const usernameMap: { [walletAddress: string]: string } = {};
          await Promise.all(
            leaderboardEntries.map(async (entry) => {
              try {
                const data = await getUsername(entry.wallet_address);
                if (data && data.length > 0) {
                  usernameMap[entry.wallet_address] = data[0].username;
                } else {
                  usernameMap[entry.wallet_address] = "-";
                }
              } catch (error) {
                console.warn(
                  `Failed to fetch username for ${entry.wallet_address}`,
                  error
                );
                usernameMap[entry.wallet_address] = "Error";
              }
            })
          );
          setUsernames(usernameMap);
        })
        .catch((error) => {
          console.warn("Failed to fetch leaderboard data", error);
        });
    }
  }, [selectedCompetition.id]);

  if (IsCompetitionError) {
    return (
      <div>Error: {(competitionError as { message: string }).message}</div>
    );
  }

  return (
    <div className="p-4 pt-40">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-3 flex items-center justify-end gap-3">
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
            {competitionLoading ? (
              <TableSkeleton />
            ) : (
              <>
                {leaderboardData.map((entry, index) => (
                  <Table.Row key={entry.id}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell>
                      {usernames[entry.wallet_address] || (
                        <Skeleton className="h-3 w-20"></Skeleton>
                      )}
                    </Table.Cell>
                    <Table.RowHeaderCell>
                      {entry.wallet_address}
                    </Table.RowHeaderCell>
                    <Table.Cell>{entry.game_id}</Table.Cell>
                    <Table.Cell>{entry.score}</Table.Cell>
                  </Table.Row>
                ))}
              </>
            )}
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  );
}

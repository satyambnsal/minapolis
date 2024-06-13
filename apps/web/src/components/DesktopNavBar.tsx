"use client";

import { Button } from "@radix-ui/themes";
import Link from "next/link";
import { ChevronLeftIcon } from "@radix-ui/react-icons";
import { PrimaryButton } from "./PrimaryButton";
import { useEffect, useState } from "react";
import { MediaPlayer } from "./MediaPlayer/page";
import { useNetworkStore } from "@/lib/stores/network";
import { formatAddress, walletInstalled } from "@/lib/helpers";
import { HeaderCard } from "@/components/common/HeaderCard";
import NetworkPicker from "@/components/common/NetworkPicker";
import AccountCard from "@/components/common/AccountCard";
import { useProfileLazyQuery } from "@/db/react-query-hooks";
import { toast } from "react-hot-toast";

export const DesktopNavBar = ({ autoConnect }: { autoConnect: boolean }) => {
  const [focusedButtonIndex, setFocusedButtonIndex] = useState<number>(0);
  const networkStore = useNetworkStore();
  const { data, isFetched } = useProfileLazyQuery(networkStore?.address || "");

  useEffect(() => {
    if (!walletInstalled()) return;

    if (autoConnect) {
      networkStore.connectWallet(true);
    }
  }, []);

  useEffect(() => {
    if (
      networkStore.walletConnected &&
      isFetched &&
      (!data?.fullname || !data?.username)
    ) {
      //Log entry
      // Show modal
      toast(
        <div>
          Hey there! It looks like you haven&apos;t completed your profile yet.
          Please{" "}
          <a href="/profile" className="text-blue-950 underline">
            complete it now
          </a>{" "}
          to get the most out of our platform
        </div>,
        {
          duration: 6000,
        }
      );
    }
  }, [networkStore.walletConnected, data, isFetched]);

  const handleFocus = (index: number) => {
    setFocusedButtonIndex(index);
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-20 mb-6 px-4 pt-2 text-black">
      <div className="flex w-full items-start justify-between">
        <div className="flex items-center gap-3">
          <PrimaryButton
            key={1}
            onFocus={() => handleFocus(1)}
            size="sm"
            icon={<ChevronLeftIcon width={30} height={30} />}
            autoFocus={1 === focusedButtonIndex}
            href={"/main-menu"}
            className={`rounded-3xl !border !border-primary !px-6`}
          />

          <div className="min-w-[180px]">
            <MediaPlayer />
          </div>
        </div>

        <div>
          <div className="flex gap-5">
            {networkStore.walletConnected && networkStore.address ? (
              <>
                <AccountCard text={formatAddress(networkStore.address)} />
                <NetworkPicker />
              </>
            ) : walletInstalled() ? (
              <HeaderCard
                svg={"account"}
                text="Connect wallet"
                isMiddle={true}
                onClick={() => {
                  networkStore.connectWallet(false);
                }}
                className="border border-primary"
              />
            ) : (
              <Link
                href="https://www.aurowallet.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <HeaderCard
                  svg={"account"}
                  text="Install wallet"
                  isMiddle={true}
                />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, label }: { to: string; label: string }) => {
  return (
    <Button variant="outline" size="3" radius="none">
      <Link href={to} className="">
        {label}
      </Link>
    </Button>
  );
};

export const AnchorNavLink = ({ to, label }: { to: string; label: string }) => {
  return (
    <Button variant="outline" size="4" radius="none">
      <a href={to} target="_blank">
        {label}
      </a>
    </Button>
  );
};
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CopyIcon } from "@radix-ui/react-icons";
import ProfileSideBar from "@/components/ProfileSideBar";
import RightSideBar from "@/components/RightSideBar";
import { useProfile, useProfileLazyQuery } from "@/db/react-query-hooks";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNetworkStore } from "@/lib/stores/network";
import {
  useObserveMinaBalance,
  useMinaBalancesStore,
} from "@/lib/stores/minaBalances";
import { useAuthSignature } from "@/hooks/useAuthSignature";
import { copyToClipBoard } from "@/lib/helpers";
import { ProfileTabs } from "@/components/profileTabs/ProfileTabs";
import { EditProfileModal } from "@/components/Modals/EditProfileModal";

export interface IFormInput {
  firstName: string;
  lastName: string;
  username: string;
  avatar_url: string;
}

export default function Profile({ initialTab }: { initialTab: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [rightSlider, setRightSlider] = useState(false);
  const minaBalancesStore = useMinaBalancesStore();
  useObserveMinaBalance();
  const networkStore = useNetworkStore();
  const { data: profileData, refetch } = useProfileLazyQuery(
    networkStore?.address || ""
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<IFormInput>({
    defaultValues: {
      firstName: (profileData?.fullname ?? "").split(" ")[0],
      lastName: (profileData?.fullname ?? "").split(" ")[1],
      username: profileData?.username || "",
      avatar_url: profileData?.avatar_url || "/img/avatars/defaultImg.webp",
    },
  });

  const { validateOrSetSignature, accountAuthSignature } = useAuthSignature();

  useEffect(() => {
    if (profileData) {
      const { fullname, username, avatar_url } = profileData;
      setValue("firstName", (fullname ?? "").split(" ")[0]);
      setValue("lastName", (fullname ?? "").split(" ")[1]);
      setValue("avatar_url", avatar_url ?? "/img/avatars/defaultImg.webp");
      setValue("username", username ?? "");
    }
  }, [profileData, setValue]);

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    const isExistApiResponse = await fetch(
      `/api/player_profile/is_username_exist?username=${data.username}&userId=${
        profileData?.id || ""
      }`
    );

    const isExist = await isExistApiResponse.json();

    if (isExist.status) {
      setError("username", {
        type: "custom",
        message: "Username already exist",
      });
      return;
    }

    return (
      profileMutation.mutate({
        wallet_address: `${networkStore?.address}`,
        username: data.username,
        fullname: `${data.firstName} ${data.lastName}`,
        avatar_url: data.avatar_url,
      }),
      closeModal()
    );
  };

  const profileMutation = useProfile({
    onSuccess: () => {
      // console.log("Profile data saved successfully");
      refetch();
    },
    onMutate: () => {
      console.log("Saving leaderboard data...");
    },
    onError: (error) => {
      console.error("Error saving leaderboard data:", error);
    },
  });

  function selectImage(imgUrl: string) {
    setValue("avatar_url", imgUrl);
  }
  const closeModal = () => {
    setModalOpen(false);
  };

  function handleToggle() {
    setRightSlider(!rightSlider);
  }

  const avatarUrl = watch("avatar_url");

  // Check if any profile field is missing
  const isProfileIncomplete =
    !profileData?.fullname ||
    !profileData?.username ||
    !profileData?.avatar_url;

  if (!networkStore.address) {
    return (
      <div className="flex w-full items-center justify-center p-8">
        <button
          className="flex cursor-pointer items-center rounded-full bg-primary px-3 py-2 font-medium text-white"
          onClick={() => {
            networkStore.connectWallet(false);
          }}
        >
          Connect your wallet first
        </button>
      </div>
    );
  }

  return (
    <div className="fade-slide-in p-4 pb-24 pt-12 md:pt-40">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="items-ceter flex flex-[0.5] gap-3">
            <div>
              {!accountAuthSignature ? (
                <button
                  onClick={async () => {
                    await validateOrSetSignature();
                    // setTimeout(() => {
                    //   refetch();
                    // }, 2000);
                  }}
                >
                  Please sign by wallet
                </button>
              ) : (
                <>
                  {!!profileData?.avatar_url && (
                    <div className="relative h-20 w-20 rounded-full">
                      <Image
                        src={profileData.avatar_url}
                        width={80}
                        height={80}
                        alt="profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <EditProfileModal
                      closeModal={closeModal}
                      modalOpen={modalOpen}
                      setModalOpen={setModalOpen}
                      isProfileIncomplete={isProfileIncomplete}
                      register={register}
                      firstNameError={errors.firstName}
                      userNameError={errors.username}
                      userNameErrorMsg={errors.username?.message}
                      onSubmit={onSubmit}
                      handleSubmit={handleSubmit}
                      handleToggle={handleToggle}
                      avatarUrl={avatarUrl}
                    />
                  </div>
                </>
              )}
            </div>
            <div>
              {!!profileData?.fullname && (
                <h3>
                  <span className="text-xl font-semibold">
                    {profileData.fullname}
                  </span>{" "}
                </h3>
              )}
              <div className="tet-sm text-gray-500">
                {!!profileData?.username && (
                  <div className="flex items-center gap-2">
                    <h3>{profileData.username}</h3>
                    <button
                      onClick={() => {
                        copyToClipBoard({
                          toCopyContent: profileData.username,
                          copiedType: "username",
                        });
                      }}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden h-full min-h-[100px] w-[1px] bg-black/10 md:block"></div>

          <div>
            <h3 className="text-xl font-semibold">Wallet Address</h3>
            <div className="flex items-center gap-2">
              <p className="break-all">{networkStore?.address}</p>

              <button
                onClick={() => {
                  copyToClipBoard({
                    toCopyContent: networkStore.address
                      ? networkStore.address
                      : "",
                    copiedType: "Wallet Address",
                  });
                }}
              >
                <CopyIcon />
              </button>
            </div>
          </div>

          <div className="hidden h-full min-h-[100px] w-[1px] bg-black/10 md:block"></div>

          <div className="mb-4 flex items-center justify-end gap-4">
            <div>Balance :</div>
            <div className="text-2xl font-semibold">
              {(
                Number(minaBalancesStore.balances[networkStore.address] ?? 0n) /
                10 ** 9
              ).toFixed(2)}
              MINA
            </div>
          </div>
        </div>
        <ProfileTabs
          walletAddress={networkStore.address}
          initialTab={initialTab}
        />
      </div>

      <RightSideBar handleToggle={handleToggle} rightSlider={rightSlider}>
        <ProfileSideBar handleToggle={handleToggle} selectImage={selectImage} />
      </RightSideBar>
    </div>
  );
}

"use client";
import { InfoCircledIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useCallback, useState } from "react";
import { DropdownMenu } from "@radix-ui/themes";
import { NFTModal } from "@/components/NFTModal";
import { useNFTEntries } from "@/db/react-query-hooks";
import { MarketplaceLoading } from "@/components/Marketplace/maretplaceLoading";
import Link from "next/link";
import { Pagination } from "@/components/common/Pagination";

const toggleGroupOptions = [
  {
    iconSrc: "/icons/gridFour.svg",
    gridApplyClass:
      "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
    id: 0,
  },

  {
    iconSrc: "/icons/gridEight.svg",
    gridApplyClass:
      "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2",
    id: 1,
  },

  {
    iconSrc: "/icons/listThree.svg",
    gridApplyClass: "list-style gap-2",
    id: 2,
  },
];

const options = [
  {
    text: "Price: High to Low",
    id: 0,
  },
  {
    text: "Price: Low to High",
    id: 1,
  },
  // {
  //   text: "Recently Listed",
  //   id: 2,
  // },
  // {
  //   text: "Common to Rare",
  //   id: 3,
  // },
  // {
  //   text: "Rare to Common",
  //   id: 4,
  // },
];

export default function Marketplace() {
  const [selectedItem, setSelectedItem] =
    useState<string>("Price: High to Low");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>("");
  const [selectedToggle, setSelectedToggle] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [renderStyle, setRenderStyle] = useState(
    toggleGroupOptions[0].gridApplyClass
  );

  //TODO: Remove active search term. there should be only one search state variablle
  const { data, isLoading, isError, error } = useNFTEntries({
    sortOrder,
    searchTerm: activeSearchTerm,
    currentPage,
  });

  const handleSearchAction = useCallback(() => {
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, setActiveSearchTerm, setCurrentPage]);

  const handleSearch = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        handleSearchAction();
      }
    },
    [handleSearchAction]
  );

  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (selectedOption: string) => {
    setSelectedItem(selectedOption);
    if (selectedOption === "Price: Low to High") {
      setSortOrder("asc");
    } else if (selectedOption === "Price: High to Low") {
      setSortOrder("desc");
    }
  };

  if (isError) {
    return (
      <div className="py-40 text-center">
        Error: {(error as { message: string }).message}
      </div>
    );
  }

  return (
    <div className="relative p-4 pb-28 pt-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 flex gap-3">
          <ul className="grid w-fit grid-cols-3 overflow-hidden rounded-md">
            {toggleGroupOptions.map((option) => {
              return (
                <li key={option.id}>
                  <button
                    className={`flex h-10 w-10 items-center justify-center hover:opacity-80 ${
                      selectedToggle === option.id
                        ? "bg-primary"
                        : "bg-primary/30"
                    }`}
                    onClick={() => {
                      setRenderStyle(option.gridApplyClass);
                      setSelectedToggle(option.id);
                    }}
                  >
                    <Image
                      src={option.iconSrc}
                      alt="grid"
                      width="20"
                      height="20"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="relative flex-1 overflow-hidden">
            <span className="text-primary-50 absolute left-3 top-1/2 -translate-y-1/2">
              <MagnifyingGlassIcon width={20} height={20} />
            </span>
            <input
              type="text"
              className="border-primary-30 h-full w-full rounded-md border bg-transparent pl-10 pr-2 font-medium outline-none placeholder:text-primary/30"
              placeholder="Search items"
              value={searchTerm}
              onChange={handleSearchInputChange}
              onKeyPress={handleSearch}
            />

            <button
              className="absolute right-0 top-0 rounded-r-md bg-primary px-3 py-2 text-white hover:bg-primary/80"
              onClick={handleSearchAction}
            >
              Search
            </button>
          </div>

          <div>
            <Tooltip.Provider delayDuration={200}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Link
                    href="/traits-info"
                    className="flex h-10 items-center justify-center gap-2 rounded-md border border-green-950 bg-green-950  px-3 font-semibold uppercase text-white hover:opacity-90"
                  >
                    <span>Traits Info</span>
                    <InfoCircledIcon
                      className="text-white"
                      width={18}
                      height={18}
                    />
                  </Link>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="max-w-[250px] rounded-xl bg-white p-4 shadow-sm"
                    sideOffset={5}
                  >
                    Click to get more info about TileVille NFTs
                    <Tooltip.Arrow className="TooltipArrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <button className="border-primary-30 flex min-w-[190px] items-center justify-between rounded-md border bg-transparent px-3 font-semibold text-primary outline-none">
                <span>{selectedItem}</span>
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
            <DropdownMenu.Content className="min-w-[190px] !bg-transparent backdrop-blur-2xl">
              {options.map((option) => {
                return (
                  <DropdownMenu.Item
                    key={option.id}
                    onClick={() => handleSortChange(option.text)}
                    className="hover:bg-primary"
                  >
                    {option.text}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
        {renderStyle === toggleGroupOptions[2].gridApplyClass && (
          <div className="list-header">
            <div className="nft-item">Item</div>
            <div className="Last-sold">Last Sold</div>
            <div>Owner</div>
            <div>Listed Time</div>
            <div>Listed Price</div>
          </div>
        )}

        <div className="">
          {data?.nfts.length === 0 ? (
            <div className="py-36 text-center">
              <h2 className="font-3xl text-center font-semibold">
                No Results Found
              </h2>
            </div>
          ) : (
            ""
          )}

          <div className={`${renderStyle} pr-2 text-lg`}>
            {isLoading ? (
              <MarketplaceLoading />
            ) : (
              <>
                {data?.nfts.map((nft) => {
                  return (
                    <NFTModal
                      traits={nft.traits}
                      img_url={nft.img_url}
                      price={nft.price}
                      name={nft.name}
                      key={nft.nft_id}
                      nftID={nft.nft_id}
                      nftPrice={nft.price}
                      renderStyle={renderStyle}
                      ownerAddress={nft.owner_address}
                      txnHash={nft.txn_hash}
                    />
                  );
                })}
              </>
            )}
          </div>
        </div>
        <Pagination
          currentPage={currentPage}
          totalCount={data?.count || 0}
          onPageChange={(page) => {
            setCurrentPage(page);
          }}
        />
      </div>
    </div>
  );
}

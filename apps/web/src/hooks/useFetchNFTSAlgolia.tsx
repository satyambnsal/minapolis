"use client";
import { CHAIN_NAME } from "@/app/api/mint-nft/constants";
// import { CHAIN_NAME } from "@/app/api/mint-nft/constants";
import algoliasearch from "algoliasearch";
import { useEffect, useState } from "react";

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_PROJECT || "",
  process.env.NEXT_PUBLIC_ALGOLIA_KEY || ""
);

const index = client.initIndex(CHAIN_NAME);

interface SearchParams {
  query: string;
  hitsPerPage: number;
  currentPage: number;
  statuses?: string[];
  owner?: string; // Changed to array to allow multiple statuses
}

interface SearchResponse {
  hits: any[];
  nbHits: number;
  nbPages: number;
  page: number;
}

export async function searchJobs(
  params: SearchParams
): Promise<SearchResponse> {
  const { query, hitsPerPage, currentPage, statuses } = params;

  let filters = "";
  if (statuses && statuses.length > 0) {
    filters = statuses.map((status) => `status:${status}`).join(" OR ");
  }
  if (params.owner) {
    filters =
      filters.length > 0
        ? `${filters} AND owner:${params.owner}`
        : `owner:${params.owner}`;
  }

  const { hits, nbHits, nbPages, page } = await index.search(query, {
    hitsPerPage,
    page: currentPage,
    filters, // Add the filters to the search query
  });

  return { hits, nbHits, nbPages, page };
}

export type AlgoliaHitResponse = {
  address: string;
  chain: string;
  collection: string;
  contractAddress: string;
  description: string;
  external_url: string;
  hash: string;
  image: string;
  ipfs: string;
  jobId: string;
  metadata: {
    data: string;
    kind: string;
  };
  name: string;
  objectID: string;
  owner: string;
  price: string;
  properties: {
    collection: Record<string, unknown>;
    description: Record<string, unknown>;
    "Sustainability Rating": Record<string, unknown>;
    "Efficiency Level": Record<string, unknown>;
    "Environmental Affinity": Record<string, unknown>;
    [key: string]: Record<string, unknown>; // For any additional properties
  };
  status: string;
  time: number;
  version: string;
};

type FetchOptions = {
  queryText?: string;
  owner?: string;
};
export const useFetchNFTSAlgolia = (options: FetchOptions) => {
  // console.log({ options });
  const [response, setResponse] = useState<AlgoliaHitResponse[]>([]);
  useEffect(() => {
    searchJobs({
      query: options.queryText || "Tileville Builder",
      hitsPerPage: 100,
      currentPage: 0,
      statuses: ["pending", "applied"],
      ...(options.owner ? { owner: options.owner } : {}),
    })
      .then((resp: any) => {
        // console.log("Algolia response", resp);
        const hits: AlgoliaHitResponse[] = resp.hits;
        setResponse(hits);
      })
      .catch((error) => {
        console.log("algolia error", error);
        setResponse([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mintNFTHitsResponse: response, searchJobs };
};

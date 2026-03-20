import { OPENSCAN_WORKER_URL } from "../config/workerConfig";
import { logger } from "../utils/logger";

export interface BlobSidecar {
  index: string;
  blob: string;
  kzg_commitment: string;
  kzg_proof: string;
  signed_block_header: {
    message: {
      slot: string;
      proposer_index: string;
      parent_root: string;
      state_root: string;
      body_root: string;
    };
    signature: string;
  };
  kzg_commitment_inclusion_proof: string[];
}

export interface BlobSidecarsResponse {
  data: BlobSidecar[];
}

type BeaconProvider = "alchemy";

/**
 * Fetch blob sidecars for a given slot via the OpenScan worker proxy.
 * Returns null if the slot is not found (pruned) or the request fails.
 */
export async function getBlobSidecarsViaWorker(
  provider: BeaconProvider,
  networkId: string,
  slot: string | number,
  signal?: AbortSignal,
): Promise<BlobSidecarsResponse | null> {
  const url = `${OPENSCAN_WORKER_URL}/beacon/${provider}/${networkId}/blob_sidecars/${slot}`;

  try {
    const response = await fetch(url, { signal });

    if (response.status === 404) {
      logger.debug(`Beacon blob sidecars not found for slot ${slot} (pruned or unavailable)`);
      return null;
    }

    if (!response.ok) {
      logger.warn(`Beacon worker responded with HTTP ${response.status} for slot ${slot}`);
      return null;
    }

    const data = (await response.json()) as BlobSidecarsResponse;
    return data;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return null;
    logger.warn("Failed to fetch blob sidecars via worker", err);
    return null;
  }
}

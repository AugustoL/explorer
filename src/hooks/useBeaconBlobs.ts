import { useEffect, useState } from "react";
import { getBlobSidecarsViaWorker, type BlobSidecarsResponse } from "../services/BeaconService";
import { logger } from "../utils/logger";

/**
 * Hook to fetch blob sidecars for a given slot via the OpenScan worker proxy.
 * Tries Alchemy as the beacon provider.
 */
export function useBeaconBlobs(
  networkId: string | undefined,
  slot: string | number | undefined,
  enabled: boolean,
): { data: BlobSidecarsResponse | null; loading: boolean } {
  const [data, setData] = useState<BlobSidecarsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !networkId || slot === undefined) {
      setData(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchBlobs = async () => {
      setLoading(true);
      try {
        const result = await getBlobSidecarsViaWorker(
          "alchemy",
          networkId,
          slot,
          controller.signal,
        );
        setData(result);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        logger.error("Error fetching beacon blobs:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBlobs();
    return () => controller.abort();
  }, [networkId, slot, enabled]);

  return { data, loading };
}

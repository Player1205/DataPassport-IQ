import { useState, useEffect, useCallback, useRef } from "react";
import { datasetsApi, verifyApi } from "@/lib/apiClient";

export interface BackendDataset {
  id: string;
  _id?: string;
  name: string;
  description: string;
  owner: string;
  ownerAddress: string;
  license: string;
  version: string;
  size?: string;
  records?: number;
  ipfsCid?: string;
  hash?: string;
  riskLevel?: string;
  riskScore?: number;
  riskFlags?: string[];
  anchored?: boolean;
  status?: string; 
  txHash?: string;
  blockNumber?: number;
  chainId?: number;
  anchoredAt?: string;
  tags?: string[];
  notes?: string;     // add string in it to store the notes for the dataset
  aiAnalysis?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UseDatasetListOptions {
  page?: number;
  limit?: number;
  search?: string;
  riskLevel?: string;
  anchored?: boolean;
  ownerAddress?: string;
  autoFetch?: boolean;
}

/**
 * Hook for the Dashboard List
 */
export function useDatasets(options: UseDatasetListOptions = {}) {
  const { autoFetch = true, ...params } = options;
  const [datasets, setDatasets] = useState<BackendDataset[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await datasetsApi.list(paramsRef.current);
      
      // Look for 'datasets' or 'data' or the raw array
      const rawArr = Array.isArray(result?.datasets) ? result.datasets 
                   : Array.isArray(result?.data) ? result.data 
                   : Array.isArray(result) ? result : [];

      const normalizedArr = rawArr.map((ds: any) => ({
        ...ds,
        id: ds.id || ds._id || "unknown"
      }));
      
      setDatasets(normalizedArr);
      if (result?.pagination) setPagination(result.pagination);
    } catch (err: unknown) {
      setError("Failed to fetch datasets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchDatasets();
  }, [autoFetch, fetchDatasets]);

  return { datasets, pagination, loading, error, refetch: fetchDatasets };
}

/**
 * Hook for the Detailed Explorer Page (The one in your screenshot)
 */
export function useDataset(id: string | undefined) {
  const [dataset, setDataset] = useState<BackendDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataset = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await datasetsApi.get(id);
      
      // ── THE FIX: Specifically look for the 'dataset' key from the backend ──
      const ds = result?.dataset || result?.data || result;
      
      if (ds && typeof ds === 'object') {
        ds.id = ds.id || ds._id;
        setDataset(ds);
      }
    } catch (err: unknown) {
      setError("Failed to fetch dataset details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  return { dataset, loading, error, refetch: fetchDataset };
}

export function useVerify() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const verify = useCallback(async (hash: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await verifyApi.hash(hash);
      setResult(res);
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, searched, verify, reset: () => setSearched(false) };
}
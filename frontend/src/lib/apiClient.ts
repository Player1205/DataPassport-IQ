import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach the JWT token to every request if we are logged in
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});   //made a client api for restricted access to the backend, and to handle token management in one place

// Intercept 401 Unauthorized responses to clear bad tokens
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("address");
    }
    return Promise.reject(error);
  }
);

export interface BackendDataset {
  id: string;
  _id?: string;
  name: string;
  description: string;
  owner: string;
  ownerAddress: string;
  license: string;
  version: string;
  size: string;
  records: number;
  ipfsCid?: string;
  hash?: string;
  riskLevel?: "low" | "medium" | "high" | "critical";
  riskScore?: number;
  riskFlags?: string[];
  anchored?: boolean;
  status?: string;
  txHash?: string;
  blockNumber?: number;
  chainId?: number;
  anchoredAt?: string;
  tags?: string[];
  notes?: string;
  aiAnalysis?: string;
  aiSummary?: string;
  anomalies?: string[];
  provenanceCard?: { steps: BackendProvenanceStep[] };
  createdAt: string;
  updatedAt?: string;
}

export interface BackendProvenanceStep {
  _id?: string;
  action: string;
  actor: string;
  actorAddress?: string;
  timestamp: string;
  notes?: string;
  txHash?: string;
  blockNumber?: number;
}

// Auth API calls
export const authApi = {
  // FIX: Accept both `nonce` and `message` from the backend
  getNonce: async (address: string): Promise<{ nonce?: string, message?: string }> => {
    const res = await apiClient.get(`/auth/nonce/${address}`);
    return res.data;
  },
  verify: async (address: string, signature: string): Promise<{ token: string; user: any }> => {
    // FIX: Send multiple variations of the address key so the backend finds exactly what it's looking for
    const res = await apiClient.post(`/auth/verify`, { 
      address, 
      walletAddress: address, 
      publicAddress: address,
      signature 
    });
    return res.data;
  },
};

// Dataset API calls
export const datasetsApi = {
  list: async (params?: any) => {
    const res = await apiClient.get(`/datasets`, { params });
    return res.data;
  },
  get: async (id: string) => {
    const res = await apiClient.get(`/datasets/${id}`);
    return res.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post(`/datasets`, data);
    return res.data;
  },
  analyze: async (id: string) => {
    const res = await apiClient.post(`/datasets/${id}/analyze`);
    return res.data;
  },
  anchor: async (id: string) => {
    const res = await apiClient.post(`/datasets/${id}/anchor`);
    return res.data;
  }
};

// Verification API calls
export const verifyApi = {
  hash: async (hash: string) => {
    const res = await apiClient.get(`/verify/${hash}`);
    return res.data;
  }
};
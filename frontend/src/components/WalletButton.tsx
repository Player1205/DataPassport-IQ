import { useState, useEffect } from "react";
import { Wallet, LogOut, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { authApi } from "@/lib/apiClient";
import { connectWallet, shortAddress } from "@/lib/web3"; 
import { ethers } from "ethers";

export default function WalletButton() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedAddress = localStorage.getItem("address");
    if (token && savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  async function handleConnect() {
    setLoading(true);
    try {
      let userAddress = "";
      let signature = "";

      // Smart Fallback: If no MetaMask is detected, use a PERSISTENT local test wallet
      if (typeof window !== "undefined" && !(window as any).ethereum) {
        console.warn("No MetaMask detected. Using a persistent local wallet for testing.");
        
        let localWallet;
        const savedKey = localStorage.getItem("mockPrivateKey");
        
        // FIX: If we already made a test wallet for you, use it again! 
        // This stops the "Ghost Identity" bug where your datasets disappear.
        if (savedKey) {
          localWallet = new ethers.Wallet(savedKey);
        } else {
          localWallet = ethers.Wallet.createRandom();
          localStorage.setItem("mockPrivateKey", localWallet.privateKey);
        }
        
        userAddress = localWallet.address;
        
        const data = await authApi.getNonce(userAddress);
        const messageToSign = data.message || data.nonce;
        if (!messageToSign) throw new Error("No message received from backend");
        
        signature = await localWallet.signMessage(messageToSign);
      } else {
        // Real MetaMask Flow
        userAddress = await connectWallet();
        
        const data = await authApi.getNonce(userAddress);
        const messageToSign = data.message || data.nonce;
        if (!messageToSign) throw new Error("No message received from backend");
        
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        signature = await signer.signMessage(messageToSign);
      }

      // Send signature to backend to get the real JWT token
      const { token } = await authApi.verify(userAddress, signature);

      localStorage.setItem("token", token);
      localStorage.setItem("address", userAddress);
      setAddress(userAddress);
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Failed to connect wallet or authenticate with backend.");
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    localStorage.removeItem("token");
    localStorage.removeItem("address");
    // Note: We deliberately DO NOT remove 'mockPrivateKey' here, 
    // so if you reconnect, you keep your identity and your datasets!
    setAddress(null);
    setDropdownOpen(false);
  }

  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <button className="btn-secondary px-4 py-2 opacity-70 cursor-wait flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs font-semibold">Connecting...</span>
      </button>
    );
  }

  if (address) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="btn-secondary px-3 py-1.5 flex items-center gap-2 border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-mono font-semibold text-text">{shortAddress(address)}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface-2 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-border bg-surface/50">
              <p className="text-[9px] font-bold text-muted-2 uppercase tracking-wider mb-0.5">Connected</p>
              <p className="text-xs font-mono text-text truncate">{address}</p>
            </div>
            <div className="p-1.5 flex flex-col">
              <button onClick={copyAddress} className="flex items-center gap-2 px-3 py-2 text-xs text-text-2 hover:bg-surface hover:text-text rounded-md transition-colors text-left">
                {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Copied!" : "Copy Address"}
              </button>
              <button onClick={handleDisconnect} className="flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-md transition-colors text-left mt-0.5">
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={handleConnect} className="btn-primary px-4 py-2 bg-accent text-void font-bold text-xs flex items-center gap-2">
      <Wallet size={14} />
      Connect Wallet
    </button>
  );
}
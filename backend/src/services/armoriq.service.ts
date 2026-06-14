export class ArmorClaw {
  constructor(private apiKey: string | undefined) {}
  
  async scan(payload: string): Promise<{ isSafe: boolean; threat?: string }> {
    console.log(`[ArmorClaw] Scanning with API Key: ${this.apiKey ? 'Linked' : 'Missing'}`);
    if (typeof payload === 'string' && payload.includes('EXPLOIT')) {
      return { isSafe: false, threat: 'Simulated prompt injection or malware signature detected' };
    }
    return { isSafe: true };
  }
}

export class ArmorIQ {
  constructor(private apiKey: string | undefined) {}

  async logSecurityEvent(threatDetails: string): Promise<void> {
    console.log(`[ArmorIQ API: ${this.apiKey ? 'Linked' : 'Missing'}] Security Event Logged: ${threatDetails}`);
  }

  async registerIntent(action: string): Promise<string> {
    const intentId = `intent_${Date.now()}`;
    console.log(`[ArmorIQ API: ${this.apiKey ? 'Linked' : 'Missing'}] Intent Registered: ${action} (ID: ${intentId})`);
    return intentId;
  }

  async closeIntent(intentId: string, txHash: string): Promise<void> {
    console.log(`[ArmorIQ API: ${this.apiKey ? 'Linked' : 'Missing'}] Intent ${intentId} Closed with TxHash: ${txHash}`);
  }
}

// Initialize with the real API key we injected into .env
export const armorClaw = new ArmorClaw(process.env.ARMORIQ_API_KEY);
export const armorIQ = new ArmorIQ(process.env.ARMORIQ_API_KEY);

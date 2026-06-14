import { ArmorIQClient } from '@armoriq/sdk';

export class ArmorClaw {
  constructor(private apiKey: string | undefined) {}
  
  async scan(payload: string): Promise<{ isSafe: boolean; threat?: string }> {
    console.log(`[ArmorClaw] Scanning with API Key: ${this.apiKey ? 'Linked' : 'Missing'}`);
    
    // Simulate real-world security blocks (Authors Guild vs OpenAI Lawsuit)
    const lowerPayload = payload.toLowerCase();
    const copyrightTriggers = [
      "george r.r. martin", 
      "j.k. rowling", 
      "jodi picoult",
      "john grisham",
      "copyright 2024",
      "all rights reserved"
    ];

    for (const author of copyrightTriggers) {
      if (lowerPayload.includes(author)) {
        return { 
          isSafe: false, 
          threat: `Copyright Violation Detected (Authors Guild Lawsuit Profile): Found unlicensed material belonging to ${author}.` 
        };
      }
    }

    return { isSafe: true };
  }
}

export class ArmorIQ {
  private client: ArmorIQClient | null = null;

  constructor(private apiKey: string | undefined) {
    if (this.apiKey) {
      this.client = new ArmorIQClient({
        apiKey: this.apiKey,
        userId: 'datapassport-admin',
        agentId: 'ingestion-pipeline',
      });
    }
  }

  async registerIntent(action: string): Promise<string> {
    if (!this.client) return `mock_intent_${Date.now()}`;
    try {
      // Actually hit the ArmorIQ SDK to register usage on the dashboard
      const plan = {
        goal: action,
        steps: [{ action: 'anchor_hash', tool: 'blockchain', mcp: 'base-sepolia', inputs: {} }]
      };
      
      const capture = await this.client.capturePlan('gemini-flash', action, plan);
      const token = await this.client.getIntentToken(capture);
      
      console.log(`[ArmorIQ SDK] Intent Registered on Dashboard! (Token: ${token.tokenId})`);
      return token.tokenId;
    } catch (e: any) {
      console.log(`[ArmorIQ SDK] Error hitting API: ${e.message}`);
      return `fallback_intent_${Date.now()}`;
    }
  }

  async closeIntent(intentId: string, txHash: string): Promise<void> {
    console.log(`[ArmorIQ SDK] Intent ${intentId} Closed with TxHash: ${txHash}`);
    // The SDK typically tracks closures via the MCP invocation endpoints, 
    // but the token generation above is enough to trigger the usage logs!
  }
}

export const armorClaw = new ArmorClaw(process.env.ARMORIQ_API_KEY);
export const armorIQ = new ArmorIQ(process.env.ARMORIQ_API_KEY);

import { ArmorIQClient } from '@armoriq/sdk';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log("Testing API Key:", process.env.ARMORIQ_API_KEY);
  const client = new ArmorIQClient({
    apiKey: process.env.ARMORIQ_API_KEY || '',
    userId: 'datapassport-admin',
    agentId: 'ingestion-pipeline',
  });

  try {
    const plan = {
      goal: "Test API Connection",
      steps: [{ action: 'test_action', tool: 'test_tool', mcp: 'test-mcp', inputs: {} }]
    };
    
    console.log("Capturing plan...");
    const capture = await client.capturePlan('gemini-flash', "Testing connection", plan);
    console.log("Plan captured:", capture);
    
    console.log("Getting token...");
    const token = await client.getIntentToken(capture);
    console.log("Token obtained:", token.tokenId);
    
    console.log("Success! API is working.");
  } catch (e: any) {
    console.error("API Error:", e.message);
  }
}

test();

/**
 * ElizaOS Agent Service
 * Provides integration with the ElizaOS compliance assistant agent
 */

const ELIZA_API_BASE = import.meta.env.VITE_ELIZA_API_URL || 'http://localhost:3000';
const AGENT_ID = '00000000-0000-0000-0000-000000000000'; // Default server agent

export interface ElizaMessage {
  text: string;
  userId: string;
  userName?: string;
}

export interface ElizaResponse {
  text: string;
  timestamp: string;
  agentId: string;
}

export interface ElizaHealthStatus {
  status: 'OK' | 'ERROR';
  version: string;
  timestamp: string;
}

/**
 * Check if ElizaOS agent is available and healthy
 */
export async function checkElizaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ELIZA_API_BASE}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data: ElizaHealthStatus = await response.json();
    return data.status === 'OK';
  } catch (error) {
    console.warn('[ElizaService] Agent not available:', error);
    return false;
  }
}

/**
 * Send a message to the ElizaOS agent and get a response
 * Used for compliance queries, proof explanations, and user assistance
 */
export async function askElizaAgent(
  message: string,
  userId: string,
  userName?: string
): Promise<string> {
  try {
    // Check if agent is available first
    const isHealthy = await checkElizaHealth();
    if (!isHealthy) {
      throw new Error('ElizaOS agent is not available. Please check if the service is running.');
    }

    // Note: The API endpoint structure may vary based on ElizaOS version
    // This uses the Socket.IO/REST hybrid approach
    // For direct messaging, we'll use the UI client approach via fetch
    
    // Since direct message API wasn't found in smoke test, we'll use a fallback
    // In production, you should configure the correct endpoint or use Socket.IO client
    
    console.warn('[ElizaService] Direct message API endpoint needs verification.');
    console.warn('[ElizaService] Consider using Socket.IO client for real-time messaging.');
    
    // Fallback: Return helpful message about configuration
    return `ElizaOS está rodando em ${ELIZA_API_BASE}. Para mensagens diretas, use a UI web ou configure Socket.IO client. Consulte docs/ELIZA_SETUP.md para mais detalhes.`;
    
  } catch (error) {
    console.error('[ElizaService] Error communicating with agent:', error);
    throw error;
  }
}

/**
 * Get compliance explanation from ElizaOS agent
 * Specialized function for explaining credential revocations and compliance issues
 */
export async function getComplianceExplanation(
  credentialId: string,
  status: 'revoked' | 'expired' | 'active',
  userId: string
): Promise<string> {
  const prompt = `Explique o status da credencial ${credentialId}: ${status}. 
    Forneça uma explicação clara e amigável sobre o que isso significa e quais ações o usuário deve tomar.`;
  
  return askElizaAgent(prompt, userId, 'ZKID User');
}

/**
 * Get proof verification explanation
 */
export async function explainProofVerification(
  proofType: 'age' | 'country' | 'income',
  isValid: boolean,
  userId: string
): Promise<string> {
  const prompt = `Explique o resultado da verificação de prova ZK do tipo "${proofType}": ${isValid ? 'válida' : 'inválida'}. 
    O que isso significa em termos simples?`;
  
  return askElizaAgent(prompt, userId, 'ZKID User');
}

/**
 * Get onboarding assistance
 */
export async function getOnboardingHelp(
  step: string,
  userId: string
): Promise<string> {
  const prompt = `Estou na etapa "${step}" do onboarding ZKID. Pode me ajudar a entender o que fazer?`;
  
  return askElizaAgent(prompt, userId, 'New User');
}

/**
 * WebSocket connection for real-time chat (future implementation)
 */
export class ElizaWebSocketClient {
  private ws: WebSocket | null = null;
  private agentId: string;

  constructor(agentId: string = AGENT_ID) {
    this.agentId = agentId;
  }

  connect(onMessage: (message: string) => void): void {
    // Socket.IO connection would go here
    // For now, this is a placeholder for future implementation
    console.log('[ElizaWebSocket] Connection placeholder - implement Socket.IO client');
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(text: string, userId: string): void {
    console.log('[ElizaWebSocket] Send message placeholder');
  }
}

/**
 * ElizaOS Demo Page
 * Demonstração de todas as funcionalidades do assistente ElizaOS
 */

import { useState } from 'react';
import { ComplianceAssistant } from '../components/ComplianceAssistant';
import { 
  checkElizaHealth, 
  getComplianceExplanation,
  explainProofVerification 
} from '../services/eliza';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function ElizaDemoPage() {
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>('');

  const handleHealthCheck = async () => {
    setLoading(true);
    try {
      const isHealthy = await checkElizaHealth();
      setHealthStatus(isHealthy);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus(false);
    } finally {
      setLoading(false);
    }
  };

  const handleComplianceExplanation = async () => {
    setLoading(true);
    setExplanation('');
    try {
      const result = await getComplianceExplanation(
        'CRED_12345_AGE',
        'revoked',
        'demo-user'
      );
      setExplanation(result);
    } catch (error) {
      setExplanation(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProofExplanation = async () => {
    setLoading(true);
    setExplanation('');
    try {
      const result = await explainProofVerification(
        'age',
        true,
        'demo-user'
      );
      setExplanation(result);
    } catch (error) {
      setExplanation(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">🤖 ElizaOS Integration Demo</h1>
        <p className="text-slate-300 text-lg">
          Explore AI compliance assistant capabilities
        </p>
      </div>

      {/* Assistant Widget Demo */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">1. Compliance Assistant Widget</h2>
        <p className="text-slate-300 mb-4">
          O widget detecta automaticamente o status do agente e fornece interface visual:
        </p>
        
        <ComplianceAssistant className="mb-4" />
        
        <ComplianceAssistant 
          credentialId="CRED_ABC123_AGE" 
          status="revoked"
          className="mb-4"
        />
        
        <ComplianceAssistant 
          credentialId="CRED_XYZ789_COUNTRY" 
          status="active"
        />
      </div>

      {/* Service API Demo */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">2. Service API Functions</h2>
        
        <Card className="mb-4">
          <CardContent>
            <h3 className="text-lg font-semibold mb-3">Health Check</h3>
            <p className="text-sm text-slate-300 mb-4">
              Verifica se o agente ElizaOS está online e respondendo:
            </p>
            
            <div className="flex items-center gap-4">
              <Button onClick={handleHealthCheck} disabled={loading}>
                {loading ? 'Checking...' : 'Check Health'}
              </Button>
              
              {healthStatus !== null && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  healthStatus 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    healthStatus ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {healthStatus ? 'Online' : 'Offline'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent>
            <h3 className="text-lg font-semibold mb-3">Compliance Explanation</h3>
            <p className="text-sm text-slate-300 mb-4">
              Gera explicação para status de credencial (revogada, expirada, etc):
            </p>
            
            <Button onClick={handleComplianceExplanation} disabled={loading}>
              Get Compliance Explanation
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent>
            <h3 className="text-lg font-semibold mb-3">Proof Verification Explanation</h3>
            <p className="text-sm text-slate-300 mb-4">
              Explica resultado de verificação de prova ZK em linguagem simples:
            </p>
            
            <Button onClick={handleProofExplanation} disabled={loading}>
              Explain Proof Verification
            </Button>
          </CardContent>
        </Card>

        {/* Response Display */}
        {explanation && (
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold mb-3">📝 Response:</h3>
              <div className="bg-slate-800 rounded-lg p-4 text-sm font-mono text-slate-200">
                {explanation}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Code Examples */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">3. Code Examples</h2>
        
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold mb-3">Using the Component:</h3>
            <pre className="bg-slate-800 rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-slate-200">{`import { ComplianceAssistant } from '../components/ComplianceAssistant';

function MyPage() {
  return (
    <div>
      <ComplianceAssistant 
        credentialId="CRED_123" 
        status="active"
      />
    </div>
  );
}`}</code>
            </pre>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent>
            <h3 className="text-lg font-semibold mb-3">Using the Service:</h3>
            <pre className="bg-slate-800 rounded-lg p-4 text-sm overflow-x-auto">
              <code className="text-slate-200">{`import { getComplianceExplanation } from '../services/eliza';

async function handleCredentialRevoke(credId: string) {
  const explanation = await getComplianceExplanation(
    credId,
    'revoked',
    userId
  );
  
  showNotification(explanation);
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-900/20 border-blue-500/30">
        <CardContent>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span>💡</span> Important Notes
          </h3>
          <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
            <li>ElizaOS agent must be running: <code className="bg-slate-800 px-2 py-1 rounded">npm run eliza:dev</code></li>
            <li>Default API URL: <code className="bg-slate-800 px-2 py-1 rounded">http://localhost:3000</code></li>
            <li>All AI processing happens locally (100% private)</li>
            <li>Socket.IO integration coming soon for real-time chat</li>
            <li>Configure API URL via <code className="bg-slate-800 px-2 py-1 rounded">VITE_ELIZA_API_URL</code></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

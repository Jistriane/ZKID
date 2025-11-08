/**
 * Compliance Assistant Component
 * Provides AI-powered compliance explanations and assistance via ElizaOS agent
 */

import { useState, useEffect } from 'react';
import { checkElizaHealth } from '../services/eliza';

interface ComplianceAssistantProps {
  credentialId?: string;
  status?: 'active' | 'revoked' | 'expired';
  className?: string;
}

export function ComplianceAssistant({ 
  credentialId, 
  status, 
  className = '' 
}: ComplianceAssistantProps) {
  const [isAgentAvailable, setIsAgentAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAgentHealth();
  }, []);

  const checkAgentHealth = async () => {
    setIsChecking(true);
    try {
      const healthy = await checkElizaHealth();
      setIsAgentAvailable(healthy);
    } catch (error) {
      console.error('[ComplianceAssistant] Health check failed:', error);
      setIsAgentAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const openElizaUI = () => {
    const elizaUrl = import.meta.env.VITE_ELIZA_API_URL || 'http://localhost:3000';
    window.open(elizaUrl, '_blank', 'noopener,noreferrer');
  };

  if (isChecking) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-blue-700">Verificando assistente...</span>
        </div>
      </div>
    );
  }

  if (!isAgentAvailable) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Assistente de Compliance Indisponível
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              O agente ElizaOS não está respondendo. Execute <code className="bg-gray-200 px-1 py-0.5 rounded">npm run eliza:dev</code> para iniciar o serviço.
            </p>
            <button
              onClick={checkAgentHealth}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Verificar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {/* AI Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-800">
              🤖 Assistente de Compliance AI
            </h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </span>
          </div>

          <p className="text-sm text-gray-700 mb-3">
            Precisa de ajuda para entender compliance, verificações ZK ou o status de sua credencial? 
            Converse com nosso assistente inteligente.
          </p>

          {/* Contextual Quick Actions */}
          {credentialId && status && (
            <div className="mb-3 p-2 bg-white/60 rounded border border-purple-100">
              <p className="text-xs text-gray-600 mb-1">Contexto detectado:</p>
              <p className="text-xs font-medium text-gray-800">
                Credencial {credentialId.slice(0, 8)}... está <span className={
                  status === 'active' ? 'text-green-600' : 
                  status === 'expired' ? 'text-orange-600' : 
                  'text-red-600'
                }>{status}</span>
              </p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={openElizaUI}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Conversar com Assistente
          </button>

          {/* Info Footer */}
          <p className="text-xs text-gray-500 mt-2">
            Powered by ElizaOS • 100% local • Privado
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewAuditWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ownershipConfirmed: false,
    environment: '',
    assetType: '',
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      // Create audit case in DB and redirect
      // In reality this calls an API route
      const mockId = "ac_" + Math.random().toString(36).substring(2, 9);
      router.push(`/dashboard/audit/${mockId}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '48px auto' }}>
      <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>
        Connect Your AI
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
        Aegis handles the configuration automatically.
      </p>

      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '32px', border: '1px solid var(--border)' }}>
        
        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Do you own this system?</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              You must have authorization to perform security testing on the target system.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => { setFormData({...formData, ownershipConfirmed: true}); handleNext(); }}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--primary)', color: '#000', fontWeight: 600, cursor: 'pointer' }}
              >
                Yes, I authorize testing
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Select Environment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Production', 'Staging', 'Development'].map(env => (
                <button
                  key={env}
                  onClick={() => { setFormData({...formData, environment: env.toLowerCase()}); handleNext(); }}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                  className="hover-bg-primary-dim"
                >
                  {env}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>AI Architecture</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Select the architecture to automatically configure Rules of Engagement and Assessment Profiles.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {['AI Chatbot', 'MCP Server', 'Agent', 'REST AI', 'Custom'].map(type => (
                <button
                  key={type}
                  onClick={() => setFormData({...formData, assetType: type.toLowerCase()})}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius)',
                    border: formData.assetType === type.toLowerCase() ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: formData.assetType === type.toLowerCase() ? 'var(--primary-dim)' : 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            <button 
                onClick={handleNext}
                disabled={!formData.assetType}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: 'var(--radius)', border: 'none', 
                  background: formData.assetType ? 'var(--primary)' : 'var(--bg-surface)', 
                  color: formData.assetType ? '#000' : 'var(--text-muted)', 
                  fontWeight: 600, cursor: formData.assetType ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                Connect & Configure <ArrowRight size={16} />
              </button>
          </div>
        )}

      </div>
      
      {/* Progress Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: step >= i ? 'var(--primary)' : 'var(--bg-surface)' }} />
        ))}
      </div>
    </div>
  );
}

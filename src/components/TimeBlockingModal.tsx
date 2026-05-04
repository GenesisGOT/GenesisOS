/**
 * TimeBlockingModal
 *
 * Shown every Monday on first boot. Three steps:
 *   1. Input  — textarea for work hours (e.g. "9am-5pm Mon-Fri")
 *   2. Loading — "Claude is building your week…"
 *   3. Preview — grouped day-by-day view + Confirm / Try Again
 */

import React, { useState, useRef, useCallback } from 'react';
import { generateTimeBlocks, saveTimeBlocks, groupBlocksByDay, dayName, extractScheduleFromImage } from '../lib/llm/time-blocker';
import type { RawBlock } from '../lib/llm/time-blocker';

// ─── Inline styles ────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(5,14,26,0.88)',
    backdropFilter: 'blur(6px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  card: {
    background: '#0A1929',
    border: '1px solid #1A3A5C',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
  },
  header: {
    padding: '24px 28px 0',
    flexShrink: 0,
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(0,212,255,0.12)',
    color: '#00D4FF',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    padding: '3px 10px',
    borderRadius: '20px',
    marginBottom: '10px',
    textTransform: 'uppercase' as const,
  },
  title: {
    color: '#FFFFFF',
    fontSize: '22px',
    fontWeight: 700,
    margin: '0 0 6px',
    fontFamily: "'Poppins', sans-serif",
  },
  subtitle: {
    color: '#8BA4BE',
    fontSize: '14px',
    margin: '0 0 20px',
    lineHeight: 1.5,
  },
  divider: {
    height: '1px',
    background: '#1A3A5C',
    margin: '0 28px',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px 28px',
  },
  textarea: {
    width: '100%',
    background: '#0F2336',
    border: '1px solid #1A3A5C',
    borderRadius: '10px',
    color: '#E2EAF4',
    fontSize: '15px',
    fontFamily: "'Poppins', sans-serif",
    padding: '14px 16px',
    resize: 'vertical' as const,
    minHeight: '90px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    lineHeight: 1.5,
  },
  hint: {
    color: '#4A6A8A',
    fontSize: '12px',
    marginTop: '8px',
    lineHeight: 1.6,
  },
  footer: {
    padding: '16px 28px 20px',
    display: 'flex',
    gap: '10px',
    flexShrink: 0,
    borderTop: '1px solid #1A3A5C',
  },
  btnPrimary: {
    flex: 1,
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #00D4FF 0%, #6C63FF 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    padding: '12px 20px',
    background: 'transparent',
    border: '1px solid #1A3A5C',
    borderRadius: '10px',
    color: '#8BA4BE',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
  errorBox: {
    background: 'rgba(255,107,107,0.1)',
    border: '1px solid rgba(255,107,107,0.3)',
    borderRadius: '8px',
    color: '#FF6B6B',
    fontSize: '13px',
    padding: '10px 14px',
    marginTop: '12px',
    lineHeight: 1.5,
  },
};

// ─── Loading Step ─────────────────────────────────────────────────────────────

function LoadingStep() {
  const dots = ['⬛', '⬜', '⬛'];
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>🧠</div>
      <div style={{ color: '#00D4FF', fontSize: '17px', fontWeight: 600, marginBottom: '8px' }}>
        Claude is building your week…
      </div>
      <div style={{ color: '#4A6A8A', fontSize: '13px', lineHeight: 1.7 }}>
        Fitting work, gym, cleaning, stretches,<br />meal prep + sleep around your schedule
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: '#00D4FF',
              opacity: 0.3,
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Block Chip ───────────────────────────────────────────────────────────────

function BlockChip({ block }: { block: RawBlock }) {
  const label12h = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 10px',
      background: `${block.color}18`,
      border: `1px solid ${block.color}44`,
      borderRadius: '8px',
      marginBottom: '5px',
    }}>
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%',
        background: block.color, flexShrink: 0,
      }} />
      <span style={{ color: '#E2EAF4', fontSize: '13px', fontWeight: 500, flex: 1 }}>
        {block.title}
      </span>
      <span style={{ color: '#4A6A8A', fontSize: '12px', whiteSpace: 'nowrap' as const }}>
        {label12h(block.start_time)} – {label12h(block.end_time)}
      </span>
    </div>
  );
}

// ─── Preview Step ─────────────────────────────────────────────────────────────

function PreviewStep({ blocks, onConfirm, onRetry, saving }: {
  blocks: RawBlock[];
  onConfirm: () => void;
  onRetry: () => void;
  saving: boolean;
}) {
  const grouped = groupBlocksByDay(blocks);
  const dates = Object.keys(grouped).sort();

  return (
    <>
      <div style={S.body}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <span style={{ color: '#E2EAF4', fontSize: '15px', fontWeight: 600 }}>
            {blocks.length} blocks generated
          </span>
          <span style={{
            color: '#00D4FF', fontSize: '12px', cursor: 'pointer',
            textDecoration: 'underline',
          }} onClick={onRetry}>
            Regenerate
          </span>
        </div>

        {dates.map(date => (
          <div key={date} style={{ marginBottom: '16px' }}>
            <div style={{
              color: '#8BA4BE',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              marginBottom: '7px',
              paddingBottom: '4px',
              borderBottom: '1px solid #1A3A5C',
            }}>
              {dayName(date)} · {date.slice(5).replace('-', '/')}
            </div>
            {grouped[date].map((block, i) => (
              <BlockChip key={i} block={block} />
            ))}
          </div>
        ))}
      </div>

      <div style={S.footer}>
        <button
          style={{ ...S.btnSecondary }}
          onClick={onRetry}
          disabled={saving}
        >
          ↺ Retry
        </button>
        <button
          style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}
          onClick={onConfirm}
          disabled={saving}
        >
          {saving ? 'Saving…' : '✓ Save to Calendar'}
        </button>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TimeBlockingModalProps {
  onComplete: () => void;
  onDismiss: () => void;
}

type Step = 'input' | 'loading' | 'preview';

export function TimeBlockingModal({ onComplete, onDismiss }: TimeBlockingModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [schedule, setSchedule] = useState('');
  const [blocks, setBlocks] = useState<RawBlock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generate = useCallback(async (workSchedule: string) => {
    setError(null);
    setStep('loading');
    try {
      const result = await generateTimeBlocks(workSchedule);
      if (result.length === 0) throw new Error('No blocks returned — try rephrasing your schedule.');
      setBlocks(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed. Check your API key.');
      setStep('input');
    }
  }, []);

  const handleGenerate = useCallback(() => {
    const val = schedule.trim();
    if (!val) {
      textareaRef.current?.focus();
      return;
    }
    generate(val);
  }, [schedule, generate]);

  const handleRetry = useCallback(() => {
    setStep('input');
    setBlocks([]);
  }, []);

  const handleConfirm = useCallback(async () => {
    setSaving(true);
    try {
      await saveTimeBlocks(blocks);
      // Force the schedule store to re-read from local DB immediately
      const { useScheduleStore } = await import('../stores/useScheduleStore');
      useScheduleStore.getState().invalidate();
      // Also broadcast for any other listeners
      window.dispatchEvent(new CustomEvent('genesisOS-refresh'));
      onComplete();
    } catch (err) {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  }, [blocks, onComplete]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageLoading(true);
    setError(null);
    try {
      const extracted = await extractScheduleFromImage(file);
      setSchedule(extracted);
      textareaRef.current?.focus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Image read failed: ${msg}. Try a clearer photo or type the schedule manually.`);
    } finally {
      setImageLoading(false);
      // Reset input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
  };

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget && step !== 'loading') onDismiss(); }}>
      <div style={S.card}>
        {/* Header — always visible */}
        <div style={S.header}>
          <div style={S.badge}>⚡ Monday Time-Blocker</div>
          <h2 style={S.title}>
            {step === 'preview' ? 'Your Week is Ready' : 'Plan Your Week'}
          </h2>
          <p style={S.subtitle}>
            {step === 'preview'
              ? 'Review your AI-generated schedule. Confirm to save it to your calendar.'
              : "Paste your work hours and Claude will build the full week — gym, sleep, cleaning, meal prep, all fitted in."}
          </p>
        </div>
        <div style={S.divider} />

        {/* Step: Loading */}
        {step === 'loading' && (
          <div style={S.body}><LoadingStep /></div>
        )}

        {/* Step: Input */}
        {step === 'input' && (
          <>
            <div style={S.body}>
              {/* Label row with image upload button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: '#8BA4BE', fontSize: '13px', fontWeight: 500 }}>
                  Work schedule this week
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageLoading}
                  title="Upload a photo of your schedule"
                  style={{
                    background: imageLoading ? 'rgba(0,212,255,0.06)' : 'rgba(0,212,255,0.1)',
                    border: '1px solid rgba(0,212,255,0.25)',
                    borderRadius: '8px',
                    color: '#00D4FF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: imageLoading ? 'not-allowed' : 'pointer',
                    padding: '5px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'opacity 0.15s',
                    opacity: imageLoading ? 0.6 : 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {imageLoading ? (
                    <>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                      Reading…
                    </>
                  ) : (
                    <>📷 Upload Photo</>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>

              <textarea
                ref={textareaRef}
                style={S.textarea}
                placeholder={"e.g. 9am-5pm Mon-Fri\nor: Mon-Thu 8am-4pm, Fri 8am-12pm\nor: Mon-Sat 10am-6pm\n\n↑ Or upload a photo of your schedule"}
                value={schedule}
                onChange={e => setSchedule(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <div style={S.hint}>
                Type your hours, or tap <strong style={{ color: '#00D4FF' }}>📷 Upload Photo</strong> to scan a schedule image. Press ⌘↵ to generate.
              </div>
              {error && <div style={S.errorBox}>⚠ {error}</div>}
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
            <div style={S.footer}>
              <button style={S.btnSecondary} onClick={onDismiss}>
                Skip this week
              </button>
              <button
                style={{ ...S.btnPrimary, opacity: schedule.trim() ? 1 : 0.5 }}
                onClick={handleGenerate}
              >
                Generate My Week →
              </button>
            </div>
          </>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <PreviewStep
            blocks={blocks}
            onConfirm={handleConfirm}
            onRetry={handleRetry}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

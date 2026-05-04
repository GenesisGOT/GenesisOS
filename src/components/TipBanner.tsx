/**
 * TipBanner
 *
 * Shows one relevant unread tip per session. Dismiss marks it as read
 * and it never appears again. Lives at the top of any page.
 *
 * Usage:
 *   <TipBanner page="/health" />
 */

import { useState, useEffect } from 'react';
import { getNextTip, markTipRead } from '../lib/tips';
import type { Tip } from '../lib/tips';

const CATEGORY_COLORS: Record<string, string> = {
  health: '#00C9A7',
  habits: '#4ECDC4',
  schedule: '#6C63FF',
  nutrition: '#55EFC4',
  ai: '#00D4FF',
  general: '#A29BFE',
};

interface TipBannerProps {
  page?: string;
  /** Extra top margin — useful below headers */
  mt?: number;
}

export function TipBanner({ page, mt = 0 }: TipBannerProps) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const next = getNextTip(page);
    if (next) {
      setTip(next);
      // Brief delay so it doesn't flash in before the page renders
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [page]);

  if (!tip || !visible) return null;

  const color = CATEGORY_COLORS[tip.category] || '#A29BFE';

  const handleDismiss = () => {
    setVisible(false);
    markTipRead(tip.id);
    setTimeout(() => setTip(null), 300);
  };

  return (
    <div
      style={{
        marginTop: mt,
        marginBottom: 16,
        padding: '12px 16px',
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-6px)',
        transition: 'opacity 0.25s, transform 0.25s',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: color,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}>
          Tip · {tip.category}
        </div>
        <div style={{ color: '#E2EAF4', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
          {tip.title}
        </div>
        <div style={{ color: '#8BA4BE', fontSize: 13, lineHeight: 1.55 }}>
          {tip.body}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        title="Got it — don't show again"
        style={{
          background: 'none',
          border: 'none',
          color: '#4A6A8A',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 2px',
          flexShrink: 0,
          lineHeight: 1,
          marginTop: 2,
        }}
        aria-label="Dismiss tip"
      >
        ✕
      </button>
    </div>
  );
}

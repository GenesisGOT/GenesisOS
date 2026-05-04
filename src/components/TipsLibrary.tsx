/**
 * TipsLibrary
 *
 * Full library of all GenesisOS tips, shown inside Settings → Tours & Help.
 * Displays read/unread state, category filter, and a "Reset All" button.
 */

import { useState, useCallback } from 'react';
import { ALL_TIPS, isTipRead, markTipRead, resetAllTips, getReadCount } from '../lib/tips';
import type { Tip } from '../lib/tips';

const CATEGORY_COLORS: Record<string, string> = {
  health: '#00C9A7',
  habits: '#4ECDC4',
  schedule: '#6C63FF',
  nutrition: '#55EFC4',
  ai: '#00D4FF',
  general: '#A29BFE',
};

const CATEGORY_LABELS: Record<string, string> = {
  health: '🫀 Health',
  habits: '✅ Habits',
  schedule: '📅 Schedule',
  nutrition: '🥗 Nutrition',
  ai: '🤖 AI',
  general: '💡 General',
};

type Filter = 'all' | 'unread' | string;

export function TipsLibrary() {
  const [filter, setFilter] = useState<Filter>('all');
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const readCount = getReadCount();
  const totalCount = ALL_TIPS.length;

  const filtered = ALL_TIPS.filter(tip => {
    if (filter === 'unread') return !isTipRead(tip.id);
    if (filter !== 'all') return tip.category === filter;
    return true;
  });

  const categories = Array.from(new Set(ALL_TIPS.map(t => t.category)));

  const handleReset = () => {
    resetAllTips();
    refresh();
  };

  const handleMarkRead = (tip: Tip) => {
    markTipRead(tip.id);
    refresh();
  };

  return (
    <div>
      {/* Progress bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{ color: '#8BA4BE', fontSize: 13 }}>
          {readCount} / {totalCount} tips read
        </span>
        <button
          onClick={handleReset}
          style={{
            background: 'none', border: '1px solid #1A3A5C', borderRadius: 6,
            color: '#4A6A8A', fontSize: 12, cursor: 'pointer', padding: '4px 10px',
          }}
        >
          ↺ Reset all
        </button>
      </div>

      <div style={{
        height: 4, background: '#0F2336', borderRadius: 4, marginBottom: 16, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${(readCount / totalCount) * 100}%`,
          background: 'linear-gradient(90deg, #00D4FF, #6C63FF)',
          borderRadius: 4,
          transition: 'width 0.4s',
        }} />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {(['all', 'unread', ...categories] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              border: filter === f ? '1px solid #00D4FF' : '1px solid #1A3A5C',
              background: filter === f ? 'rgba(0,212,255,0.12)' : 'transparent',
              color: filter === f ? '#00D4FF' : '#8BA4BE',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: filter === f ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {f === 'all' ? '✦ All' : f === 'unread' ? '● Unread' : CATEGORY_LABELS[f] || f}
          </button>
        ))}
      </div>

      {/* Tip cards */}
      {filtered.length === 0 && (
        <div style={{ color: '#4A6A8A', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
          {filter === 'unread' ? '🎉 You\'ve read all the tips!' : 'No tips in this category.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(tip => {
          const read = isTipRead(tip.id);
          const color = CATEGORY_COLORS[tip.category] || '#A29BFE';
          return (
            <div
              key={tip.id}
              style={{
                padding: '12px 14px',
                background: read ? '#0A1929' : `${color}0E`,
                border: `1px solid ${read ? '#1A3A5C' : color + '30'}`,
                borderLeft: `3px solid ${read ? '#1A3A5C' : color}`,
                borderRadius: 10,
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                opacity: read ? 0.55 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{tip.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3,
                }}>
                  <span style={{
                    color: read ? '#4A6A8A' : color,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    {tip.category}
                  </span>
                  {read && (
                    <span style={{
                      color: '#4A6A8A', fontSize: 10, border: '1px solid #1A3A5C',
                      borderRadius: 4, padding: '1px 5px',
                    }}>
                      read
                    </span>
                  )}
                </div>
                <div style={{ color: '#E2EAF4', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                  {tip.title}
                </div>
                <div style={{ color: '#8BA4BE', fontSize: 13, lineHeight: 1.55 }}>
                  {tip.body}
                </div>
              </div>
              {!read && (
                <button
                  onClick={() => handleMarkRead(tip)}
                  title="Mark as read"
                  style={{
                    background: 'none', border: '1px solid #1A3A5C', borderRadius: 6,
                    color: '#4A6A8A', fontSize: 11, cursor: 'pointer', padding: '3px 8px',
                    flexShrink: 0, marginTop: 2,
                  }}
                >
                  ✓ Read
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Lock, Zap, Check, Loader2, Calendar, BookOpen, ArrowLeftRight, Shield, Clock, ArrowRight, Search, X, AlertTriangle, ExternalLink, Globe } from 'lucide-react';
import { useJunction, useJunctionPractices, useJunctionCalendar, useJunctionWisdom, useLogPractice } from '../../hooks/useJunction';
import type { JunctionTradition, JunctionFigure } from '../../hooks/useJunction';
import { showToast } from '../Toast';
import { useGamificationContext } from '../../lib/gamification/context';
import { formatEthiopianDate } from '../../utils/ethiopian-calendar';
import { TraditionHeroBg, TraditionIcon, FigureAvatar } from './TraditionIcons';
import { TIER_LABELS, TRADITION_CATEGORIES, TRADITION_META, FAITH_PATH_URLS, FALLBACK_TRADITIONS, getFaithPathInfo, type TraditionCategory } from './constants';
import { SwitchJunctionModal } from './SwitchJunctionModal';

export function JunctionDashboard({
  userJunction: _userJunction,
  tradition,
  figures,
  xpProgress,
  onUnjunction,
  onRefresh,
  onSwitchJunction,
}: {
  userJunction: NonNullable<ReturnType<typeof useJunction>['userJunction']>;
  tradition: NonNullable<ReturnType<typeof useJunction>['tradition']>;
  figures: JunctionFigure[];
  xpProgress: ReturnType<typeof useJunction>['xpProgress'];
  onUnjunction: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onSwitchJunction: (newTraditionId: string) => Promise<{ error?: string; success?: boolean }>;
}) {
  const currentTier = xpProgress.currentFigure?.tier ?? 0;
  const { practices, loading: practicesLoading } = useJunctionPractices(tradition.id, currentTier);
  const { entries: calendarEntries } = useJunctionCalendar(tradition.id);
  const { wisdom } = useJunctionWisdom(tradition.id);
  const { logPractice, logging } = useLogPractice();
  const { awardXP } = useGamificationContext();
  const [confirmUnjunction, setConfirmUnjunction] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [loggedPractice, setLoggedPractice] = useState<string | null>(null);

  const { traditions: allTraditions } = useJunction();

  const handleLogPractice = useCallback(async (practiceId: string, xpReward: number) => {
    const result = await logPractice(practiceId, 15, undefined, xpReward);
    if (result) {
      setLoggedPractice(practiceId);
      if (result.figureUnlocked) {
        showToast(`🌟 New Figure Unlocked! +${result.xpAwarded} Junction XP`, 'success');
      } else {
        showToast(`+${result.xpAwarded} Junction XP ✨`, 'success');
      }
      awardXP('junction_practice', {
        tradition: tradition.slug,
        tier: currentTier || 1,
        description: `Junction practice — ${tradition.name}`,
      });
      await onRefresh();
      setTimeout(() => setLoggedPractice(null), 3000);
    }
  }, [logPractice, onRefresh, awardXP, tradition.slug, tradition.name, currentTier]);

  const handleUnjunction = async () => {
    await onUnjunction();
    showToast('Junction removed', 'success');
    setConfirmUnjunction(false);
  };

  return (
    <div className="jnc-dashboard" style={{ '--trad-color': tradition.color } as React.CSSProperties}>
      {/* Quick Switch Bar */}
      <div className="jnc-quick-switch">
        <div className="jnc-quick-switch-info">
          <TraditionIcon slug={tradition.slug} emoji={tradition.icon} size={22} />
          <span className="jnc-quick-switch-name">{tradition.name}</span>
        </div>
        <button className="jnc-quick-switch-btn" onClick={() => setShowSwitchModal(true)}>
          <ArrowLeftRight size={13} /> Switch
        </button>
      </div>

      {/* Current Figure Card */}
      {xpProgress.currentFigure && (
        <div className="jnc-figure-card">
          <div className="jnc-figure-inner">
            <div className="jnc-figure-avatar"><FigureAvatar figure={xpProgress.currentFigure} size="lg" /></div>
            <div className="jnc-figure-info">
              <div className={`jnc-tier-badge tier-${xpProgress.currentFigure.tier}`}>
                <TraditionIcon slug={tradition.slug} emoji={tradition.icon} size={14} /> {TIER_LABELS[xpProgress.currentFigure.tier] || `Tier ${xpProgress.currentFigure.tier}`}
              </div>
              <div className="jnc-figure-name">{xpProgress.currentFigure.name}</div>
              <div className="jnc-figure-title">{xpProgress.currentFigure.title}</div>
              <div className="jnc-figure-bio">{xpProgress.currentFigure.bio}</div>
            </div>
          </div>
        </div>
      )}

      {/* Explore Tradition Banner */}
      <ExploreTraditionBanner tradition={tradition} />

      {/* XP Bar */}
      <div className="jnc-xp-section">
        <div className="jnc-xp-header">
          <span className="jnc-xp-label">Junction XP</span>
          <span className="jnc-xp-numbers">{xpProgress.currentXP} / {xpProgress.xpToNextFigure} XP</span>
        </div>
        <div className="jnc-xp-bar">
          <div className="jnc-xp-fill" style={{ width: `${Math.min(xpProgress.progressPercent, 100)}%` }} />
        </div>
        {xpProgress.nextFigure && (
          <div className="jnc-xp-next">Next: {xpProgress.nextFigure.name} ({xpProgress.nextFigure.xp_required} XP)</div>
        )}
      </div>

      {/* Progression Timeline */}
      {figures.length > 0 && (
        <div className="jnc-progression">
          <div className="jnc-prog-label">Progression Path</div>
          <div className="jnc-prog-timeline">
            {figures.map(fig => (
              <div key={fig.id} className={`jnc-prog-node ${fig.unlocked ? 'unlocked' : 'locked'} ${fig.is_current ? 'current' : ''}`}>
                <div className="jnc-prog-avatar">{fig.unlocked ? <FigureAvatar figure={fig} size="sm" /> : <Lock size={14} />}</div>
                <span className="jnc-prog-name">{fig.unlocked ? fig.name : '???'}</span>
                {!fig.unlocked && <span className="jnc-prog-xp">{fig.xp_required} XP</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Practices */}
      <div className="jnc-practices">
        <div className="jnc-practices-label"><Zap size={12} /> Active Practices</div>
        {practicesLoading ? (
          <div className="jnc-no-practices">Loading practices…</div>
        ) : practices.length === 0 ? (
          <div className="jnc-no-practices">No practices available for your current tier.</div>
        ) : (
          <div className="jnc-practice-list">
            {practices.map(p => (
              <div key={p.id} className="jnc-practice-item">
                <span className="jnc-practice-icon">
                  {p.icon.startsWith('/') ? <img src={p.icon} alt={p.name} className="jnc-icon-image" /> : p.icon}
                </span>
                <div className="jnc-practice-info">
                  <div className="jnc-practice-name">{p.name}</div>
                  <div className="jnc-practice-desc">{p.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {loggedPractice === p.id ? (
                    <span className="jnc-log-success"><Check size={12} /> Done!</span>
                  ) : (
                    <button className="jnc-practice-log-btn" onClick={() => handleLogPractice(p.id, p.xp_reward)} disabled={logging}>
                      {logging ? <Loader2 size={11} className="spin" /> : <Check size={11} />} Log
                    </button>
                  )}
                  <div className="jnc-practice-xp">+{p.xp_reward} XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar + Wisdom Row */}
      <div className="jnc-row">
        <div className="jnc-calendar">
          <div className="jnc-section-label"><Calendar size={12} /> Today's Observances</div>
          {tradition.calendar_type === 'ethiopian' && (
            <div className="jnc-cal-ethdate">{formatEthiopianDate(new Date())}</div>
          )}
          {calendarEntries.length === 0 ? (
            <div className="jnc-cal-empty">No special observances today</div>
          ) : (
            calendarEntries.map(entry => (
              <div key={entry.id} className="jnc-cal-entry">
                <span className="jnc-cal-icon">
                  {entry.icon.startsWith('/') ? <img src={entry.icon} alt={entry.name} className="jnc-icon-image" /> : entry.icon}
                </span>
                <div>
                  <div className="jnc-cal-name">{entry.name}</div>
                  <div className="jnc-cal-desc">{entry.description}</div>
                  <span className={`jnc-cal-type ${entry.type}`}>{entry.type.replace('_', ' ')}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="jnc-wisdom">
          <div className="jnc-section-label"><BookOpen size={12} /> Daily Wisdom</div>
          {wisdom ? (
            <>
              <div className="jnc-wisdom-text">{wisdom.text}</div>
              {wisdom.source && <div className="jnc-wisdom-source">— {wisdom.source}</div>}
            </>
          ) : (
            <div className="jnc-wisdom-empty">No wisdom entry for today</div>
          )}
        </div>
      </div>

      {/* Switch / Remove Junction */}
      <div className="jnc-switch-section">
        <button className="jnc-switch-btn" onClick={() => setShowSwitchModal(true)}>
          <ArrowLeftRight size={14} /> Switch Junction
        </button>
        {confirmUnjunction ? (
          <div className="jnc-remove-confirm">
            <span>Remove junction entirely?</span>
            <button className="jnc-remove-yes" onClick={handleUnjunction}>Yes, remove</button>
            <button className="jnc-remove-no" onClick={() => setConfirmUnjunction(false)}>Cancel</button>
          </div>
        ) : (
          <button className="jnc-remove-btn" onClick={() => setConfirmUnjunction(true)}>Remove junction</button>
        )}
      </div>

      {/* Switch Junction Modal */}
      {showSwitchModal && (
        <SwitchJunctionModal
          currentTradition={tradition}
          allTraditions={allTraditions}
          equippedAt={_userJunction.equipped_at}
          onSwitch={async (newTradId) => {
            const result = await onSwitchJunction(newTradId);
            if (result.error) {
              showToast(result.error, 'error');
            } else {
              showToast('Junction switched! 🔮', 'success');
              setShowSwitchModal(false);
              await onRefresh();
            }
            return result;
          }}
          onClose={() => setShowSwitchModal(false)}
        />
      )}
    </div>
  );
}

// ═══ Explore Tradition Banner ═══
function ExploreTraditionBanner({ tradition }: { tradition: JunctionTradition }) {
  const faithPath = getFaithPathInfo(tradition.slug);
  if (!faithPath) return null;

  return (
    <a
      href={faithPath.url}
      target="_blank"
      rel="noopener noreferrer"
      className="jnc-explore-banner"
      style={{
        '--banner-color': tradition.color,
        '--banner-gradient': tradition.background_gradient || `linear-gradient(135deg, ${tradition.color}22, ${tradition.color}44)`,
      } as React.CSSProperties}
    >
      <TraditionHeroBg slug={tradition.slug} />
      <div className="jnc-explore-bg" />
      <div className="jnc-explore-content">
        <div className="jnc-explore-left">
          <span className="jnc-explore-icon"><TraditionIcon slug={tradition.slug} emoji={tradition.icon} size={32} /></span>
          <div>
            <div className="jnc-explore-title">Explore {tradition.name}</div>
            <div className="jnc-explore-tagline">{faithPath.tagline}</div>
          </div>
        </div>
        <div className="jnc-explore-cta"><span>Deep Dive</span><ArrowRight size={14} /></div>
      </div>
      <div className="jnc-explore-site"><ExternalLink size={10} /> {faithPath.siteName}.com.au</div>
    </a>
  );
}

// ═══ Faith Paths Network ═══
export function FaithPathsNetwork({ equippedSlug }: { equippedSlug?: string }) {
  const paths = Object.entries(FAITH_PATH_URLS);

  return (
    <div className="jnc-network">
      <div className="jnc-network-header">
        <Globe size={14} className="jnc-network-globe" />
        <div>
          <div className="jnc-network-title">Faith Paths Network</div>
          <div className="jnc-network-subtitle">Explore dedicated tradition websites</div>
        </div>
      </div>
      <div className="jnc-network-grid">
        {paths.map(([slug, info]) => {
          const meta = TRADITION_META[slug];
          const isEquipped = slug === equippedSlug;
          return (
            <a
              key={slug}
              href={info.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`jnc-network-card ${isEquipped ? 'equipped' : ''}`}
              style={{ '--net-color': meta?.color || '#A855F7' } as React.CSSProperties}
            >
              <TraditionHeroBg slug={slug} />
              <div className="jnc-network-card-top">
                <span className="jnc-network-icon"><TraditionIcon slug={slug} emoji={meta?.icon || '🔮'} size={28} /></span>
                {isEquipped && (
                  <span className="jnc-network-equipped"><Sparkles size={10} /> Equipped</span>
                )}
              </div>
              <div className="jnc-network-name">{info.siteName}</div>
              <div className="jnc-network-tagline">{info.tagline}</div>
              <div className="jnc-network-link"><ExternalLink size={10} /> Visit site</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

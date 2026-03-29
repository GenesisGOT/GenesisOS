import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Sparkles } from 'lucide-react';
import { assetPath } from '../../utils/assets';
import { ALPHA_MESSAGES, OMEGA_MESSAGES } from './constants';

// ═══ Alpha Intro (Full-Screen Cinematic) ═══
export function AlphaIntro({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const alphaImgPath = assetPath(`/junction/traditions/${slug}/alpha.webp`);
  const introVideoPath = assetPath(`/junction/traditions/${slug}/alpha.mp4`);

  const message = ALPHA_MESSAGES[slug] || "Welcome. Your journey begins.";

  return createPortal(
    <div className="jnc-alpha-overlay">
      {!videoError && (
        <video
          className="jnc-alpha-video"
          src={introVideoPath}
          autoPlay muted playsInline
          onError={() => setVideoError(true)}
          onEnded={(e) => e.currentTarget.pause()}
        />
      )}
      {(videoError || !introVideoPath) && !imgError && (
        <img src={alphaImgPath} alt="" className="jnc-alpha-img" onError={() => setImgError(true)} />
      )}
      <div className="jnc-alpha-content">
        <div className="jnc-alpha-message">{message}</div>
        <button className="jnc-alpha-btn" onClick={onClose}><Play size={16} /> Begin Your Journey</button>
      </div>
    </div>,
    document.body
  );
}

// ═══ Omega Outro (Full-Screen Cinematic — Completion) ═══
export function OmegaOutro({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [fallbackVideoError, setFallbackVideoError] = useState(false);
  const omegaImgPath = assetPath(`/junction/traditions/${slug}/omega.webp`);
  const outroVideoPath = assetPath(`/junction/traditions/${slug}/omega.mp4`);
  const fallbackVideoPath = assetPath(`/junction/tutorial/omega.mp4`);

  const message = OMEGA_MESSAGES[slug] || "Your journey is complete. Rise and walk again.";

  return createPortal(
    <div className="jnc-alpha-overlay jnc-omega-overlay">
      {!videoError && (
        <video className="jnc-alpha-video" src={outroVideoPath} autoPlay muted loop playsInline onError={() => setVideoError(true)} />
      )}
      {videoError && !fallbackVideoError && (
        <video className="jnc-alpha-video" src={fallbackVideoPath} autoPlay muted loop playsInline onError={() => setFallbackVideoError(true)} />
      )}
      {videoError && fallbackVideoError && !imgError && (
        <img src={omegaImgPath} alt="" className="jnc-alpha-img" onError={() => setImgError(true)} />
      )}
      <div className="jnc-alpha-content">
        <div className="jnc-alpha-message">{message}</div>
        <button className="jnc-alpha-btn jnc-omega-btn" onClick={onClose}><Sparkles size={16} /> Journey Complete</button>
      </div>
    </div>,
    document.body
  );
}

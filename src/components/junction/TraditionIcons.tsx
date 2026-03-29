import { useState } from 'react';
import { assetPath } from '../../utils/assets';

// Tradition background image — tries /junction/traditions/{slug}/heroes/hero.webp, falls back to gradient
export function TraditionHeroBg({ slug }: { slug: string }) {
  const [imgError, setImgError] = useState(false);
  const imgPath = assetPath(`/junction/traditions/${slug}/heroes/hero.webp`);

  if (imgError) return null;

  return (
    <div className="jnc-trad-hero-bg">
      <img
        src={imgPath}
        alt=""
        className="jnc-trad-hero-img"
        onError={() => setImgError(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

// Tradition icon component — loads custom icon.webp, falls back to emoji
export function TraditionIcon({ slug, emoji, size = 32 }: { slug: string; emoji: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const imgPath = assetPath(`/junction/traditions/${slug}/icon.webp`);

  if (imgError) {
    return <span className="jnc-trad-icon-emoji" style={{ fontSize: size }}>{emoji}</span>;
  }

  return (
    <img
      src={imgPath}
      alt={slug}
      className="jnc-trad-icon-img"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

// Figure card image component — shows card art if available, falls back to emoji
export function FigureAvatar({ figure, size = 'md' }: { figure: { id: string; icon: string; name?: string }; size?: 'sm' | 'md' | 'lg' }) {
  const [imgError, setImgError] = useState(false);
  const imgPath = assetPath(`/junction/figures/${figure.id}.webp`);
  const sizeClass = `jnc-figure-avatar-img jnc-avatar-${size}`;

  if (imgError) {
    return <span className={`jnc-figure-avatar-emoji jnc-avatar-${size}`}>{figure.icon}</span>;
  }

  return (
    <img
      src={imgPath}
      alt={figure.name || figure.id}
      className={sizeClass}
      onError={() => setImgError(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

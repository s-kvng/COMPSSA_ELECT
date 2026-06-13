import type { Sponsor } from './types';

export function getSponsorConfig(): Sponsor | null {
  const name = process.env.NEXT_PUBLIC_SPONSOR_NAME;
  const ctaUrl = process.env.NEXT_PUBLIC_SPONSOR_URL;
  if (!name || !ctaUrl) return null;
  return {
    name,
    logoText: process.env.NEXT_PUBLIC_SPONSOR_LOGO_TEXT ?? 'RL',
    tagline: process.env.NEXT_PUBLIC_SPONSOR_TAGLINE ?? '',
    ctaLabel: process.env.NEXT_PUBLIC_SPONSOR_CTA_LABEL ?? 'Learn more',
    ctaUrl,
  };
}
'use client'

import type { ImgHTMLAttributes } from 'react'

/**
 * Wrapper around <img> for auth-protected image routes (/api/images/...).
 * next/image cannot be used because the image optimizer fetches server-side
 * without the user's session cookie. SafeImage adds lazy loading and async
 * decoding to reduce initial page weight and improve LCP.
 */
export function SafeImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} loading="lazy" decoding="async" />
}

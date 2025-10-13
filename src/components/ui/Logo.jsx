import React, { useState, useEffect } from 'react';
import { ensureHttps } from '../utils/urlUtils';

const DEFAULT_LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68eb8923823e4a358cf1b54a/bd6ff87c4_logo_400x400.png';

export default function Logo({ src, alt = 'Agentic ERP Logo', className = '' }) {
  const [currentSrc, setCurrentSrc] = useState(DEFAULT_LOGO_URL);

  useEffect(() => {
    const secureSrc = ensureHttps(src);
    if (secureSrc) {
      setCurrentSrc(secureSrc);
    } else {
      setCurrentSrc(DEFAULT_LOGO_URL);
    }
  }, [src]);

  const handleError = () => {
    if (currentSrc !== DEFAULT_LOGO_URL) {
      setCurrentSrc(DEFAULT_LOGO_URL);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
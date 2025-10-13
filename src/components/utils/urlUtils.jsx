export const ensureHttps = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  if (!url.startsWith('https://')) {
    // If it's a relative path or has no protocol, we assume it's an external link needing https.
    // This logic might need adjustment if you have internal relative image paths.
    // For Supabase URLs, this is generally safe.
    if(url.startsWith('//')) {
         return `https:${url}`;
    }
    // A simple check if it looks like a domain.
    if(url.includes('.')) {
        // Heuristic: if it doesn't have a protocol, add one.
        // This is not perfect but covers many cases.
        if(!url.startsWith('http')) {
             return `https://${url}`;
        }
    }
  }
  return url;
};
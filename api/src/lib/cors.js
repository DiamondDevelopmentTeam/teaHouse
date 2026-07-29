export function isOriginAllowed(origin, allowedOrigins) {
  return !origin || allowedOrigins.includes(origin);
}

export function corsHeaders(origin, allowedOrigins) {
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}


import app from '../server.ts';

export default function handler(req: any, res: any) {
  // If request was rewritten to /api without subpath, check for original path header
  const orig = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'];
  if ((req.url === '/api' || req.url === '/' || req.url === '') && orig && typeof orig === 'string' && orig.startsWith('/api')) {
    req.url = orig;
  }
  return app(req, res);
}


import { NextResponse, type NextRequest } from 'next/server';

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

function applySecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/|_static/|_vercel|favicon.ico|images/|fonts/|[\\w-]+\\.\\w+).*)'],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'reviewtap.in').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const appHost = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : null;

  // Remove port for local development
  const currentHost = hostname.replace(/:\d+$/, '');
  const isLocalHost = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const validRootHosts = new Set([
    rootDomain,
    `www.${rootDomain}`,
    ...(appHost ? [appHost, `www.${appHost}`] : []),
    'localhost',
    '127.0.0.1',
  ]);

  // Extract subdomain
  let subdomain: string | null = null;

  // Production: {slug}.{rootDomain}
  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, '');
  }
  // Local dev / app-hosted root domains: use ?tenant= query param, but keep app routes such as /dashboard and /admin on the real app.
  else if (validRootHosts.has(currentHost)) {
    if (
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/tenant') ||
      url.pathname.startsWith('/api') ||
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/favicon.ico')
    ) {
      return applySecurityHeaders(NextResponse.next());
    }

    subdomain = url.searchParams.get('tenant');
  }

  // 1. Admin Portal: admin.reviewtap.in
  if (subdomain === 'admin') {
    const newUrl = new URL(`/admin${url.pathname}`, req.url);
    newUrl.search = url.search;
    return applySecurityHeaders(NextResponse.rewrite(newUrl));
  }

  // 2. Main Marketing Site: reviewtap.in or www.reviewtap.in
  if (!subdomain || subdomain === 'www') {
    const newUrl = new URL(`/marketing${url.pathname}`, req.url);
    newUrl.search = url.search;
    return applySecurityHeaders(NextResponse.rewrite(newUrl));
  }

  // 3. Business subdomain: {slug}.reviewtap.in
  // Set the business slug as a header for downstream use
  const response = applySecurityHeaders(NextResponse.next());

  // Dashboard routes: {slug}.reviewtap.in/dashboard/*
  if (url.pathname.startsWith('/dashboard')) {
    const newUrl = new URL(`/dashboard${url.pathname.replace('/dashboard', '')}`, req.url);
    newUrl.search = url.search;
    const rewrite = applySecurityHeaders(NextResponse.rewrite(newUrl));
    rewrite.headers.set('x-business-slug', subdomain);
    return rewrite;
  }

  // Staff/Employee routes: {slug}.reviewtap.in/staff/{employee-slug}
  if (url.pathname.startsWith('/staff/')) {
    const employeeSlug = url.pathname.replace('/staff/', '').split('/')[0];
    const newUrl = new URL(`/tenant/staff/${employeeSlug}${url.pathname.replace(`/staff/${employeeSlug}`, '')}`, req.url);
    newUrl.search = url.search;
    const rewrite = applySecurityHeaders(NextResponse.rewrite(newUrl));
    rewrite.headers.set('x-business-slug', subdomain);
    rewrite.headers.set('x-employee-slug', employeeSlug);
    return rewrite;
  }

  // Customer-facing tenant page: {slug}.reviewtap.in
  const newUrl = new URL(`/tenant${url.pathname}`, req.url);
  newUrl.search = url.search;
  const rewrite = applySecurityHeaders(NextResponse.rewrite(newUrl));
  rewrite.headers.set('x-business-slug', subdomain);
  return rewrite;
}

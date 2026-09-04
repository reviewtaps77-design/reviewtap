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

function normalizeHost(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const host = value.includes('://') ? new URL(value).hostname : value;
    return host.replace(/:\d+$/, '').replace(/\.$/, '').toLowerCase();
  } catch {
    return value.replace(/:\d+$/, '').replace(/\.$/, '').toLowerCase();
  }
}

const PLATFORM_HOST_SUFFIXES = ['.hosted.app', '.web.app', '.firebaseapp.com', '.run.app'];

function isPlatformHost(host: string): boolean {
  return PLATFORM_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

// Routes that never need a business slug — either no tenant concept
// (/admin, /api) or the business comes from the logged-in session
// rather than the URL (/dashboard). Public complaint links
// (/complaint/<token>) resolve their own business from the token.
function isTenantFreeRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/complaint') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  );
}

// Routes that genuinely need a business slug from the URL/subdomain.
function isTenantScopedRoute(pathname: string): boolean {
  return pathname.startsWith('/staff/');
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const rootDomain = normalizeHost(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'reviewtap.in') || 'reviewtap.in';
  const appHost = normalizeHost(process.env.NEXT_PUBLIC_APP_URL) || 'reviewtap--reviewtap-235c2.asia-southeast1.hosted.app';

  const currentHost = hostname.replace(/:\d+$/, '').toLowerCase();
  const isLocalHost = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const isHostedAppRoot =
    currentHost === appHost || currentHost === `www.${appHost}` || isPlatformHost(currentHost);
  const isRootLikeHost =
    isLocalHost || isHostedAppRoot || currentHost === rootDomain || currentHost === `www.${rootDomain}`;

  let subdomain: string | null = null;
  let effectivePathname = url.pathname;
  let tenantBase = '';

  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, '');
  } else if (isRootLikeHost) {
    if (url.pathname.startsWith('/biz/')) {
      const segments = url.pathname.replace('/biz/', '').split('/');
      const businessSlug = segments[0];
      const rest = segments.slice(1).join('/');
      subdomain = businessSlug;
      effectivePathname = rest ? `/${rest}` : '/';
      tenantBase = `/biz/${businessSlug}`;
    } else if (isTenantFreeRoute(url.pathname)) {
      return applySecurityHeaders(NextResponse.next());
    } else if (isTenantScopedRoute(url.pathname)) {
      const tenant = url.searchParams.get('tenant');
      if (!tenant) {
        const newUrl = new URL('/marketing/login', req.url);
        return applySecurityHeaders(NextResponse.redirect(newUrl));
      }
      subdomain = tenant;
    } else {
      subdomain = url.searchParams.get('tenant');
    }
  }

  if (subdomain === 'admin') {
    const newUrl = new URL(`/admin${effectivePathname}`, req.url);
    newUrl.search = url.search;
    return applySecurityHeaders(NextResponse.rewrite(newUrl));
  }

  if (!subdomain || subdomain === 'www') {
    const newUrl = new URL(`/marketing${effectivePathname}`, req.url);
    newUrl.search = url.search;
    return applySecurityHeaders(NextResponse.rewrite(newUrl));
  }

  if (effectivePathname.startsWith('/dashboard')) {
    const newUrl = new URL(`/dashboard${effectivePathname.replace('/dashboard', '')}`, req.url);
    newUrl.search = url.search;
    const rewrite = applySecurityHeaders(NextResponse.rewrite(newUrl));
    rewrite.headers.set('x-business-slug', subdomain);
    return rewrite;
  }

  if (effectivePathname.startsWith('/staff/')) {
    const employeeSlug = effectivePathname.replace('/staff/', '').split('/')[0];
    const newUrl = new URL(
      `/tenant/staff/${employeeSlug}${effectivePathname.replace(`/staff/${employeeSlug}`, '')}`,
      req.url
    );
    newUrl.search = url.search;
    const rewrite = applySecurityHeaders(NextResponse.rewrite(newUrl));
    rewrite.headers.set('x-business-slug', subdomain);
    rewrite.headers.set('x-employee-slug', employeeSlug);
    rewrite.headers.set('x-tenant-base', tenantBase);
    return rewrite;
  }

  const newUrl = new URL(`/tenant${effectivePathname}`, req.url);
  newUrl.search = url.search;
  const rewrite = applySecurityHeaders(NextResponse.rewrite(newUrl));
  rewrite.headers.set('x-business-slug', subdomain);
  rewrite.headers.set('x-tenant-base', tenantBase);
  return rewrite;
}

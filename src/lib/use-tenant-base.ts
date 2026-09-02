"use client";

import { usePathname } from "next/navigation";

/**
 * Returns the correct base path prefix for tenant navigation.
 * - On /biz/{slug}/... routes (platform hosts without a custom domain), returns "/biz/{slug}".
 * - On a real subdomain, the pathname has no /biz/ prefix, so returns "".
 */
export function useTenantBase(): string {
  const pathname = usePathname();
  const match = pathname.match(/^\/biz\/([^/]+)/);
  return match ? `/biz/${match[1]}` : "";
}

import { db } from './db';

export async function resolveBusinessBySlug(slug: string) {
  const business = await db.business.findUnique({
    where: { slug },
    include: {
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  return business;
}

export async function resolveEmployee(businessId: string, employeeSlug: string) {
  const employee = await db.employee.findUnique({
    where: {
      businessId_slug: {
        businessId,
        slug: employeeSlug,
      },
    },
  });
  return employee;
}

export function extractSubdomain(hostname: string, rootDomain: string): string | null {
  const cleaned = hostname.replace(/:\d+$/, '');
  if (cleaned === rootDomain || cleaned === `www.${rootDomain}`) return null;
  if (cleaned.endsWith(`.${rootDomain}`)) {
    return cleaned.replace(`.${rootDomain}`, '');
  }
  return null;
}

import { auth } from './auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  return session as NonNullable<typeof session>;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as any).role !== 'admin') {
    redirect('/login');
  }
  return session;
}

export async function requireOwner() {
  const session = await requireAuth();
  if ((session.user as any).role !== 'business_owner') {
    redirect('/login');
  }
  return session;
}

export async function requireOwnerOfBusiness(businessId: string) {
  const session = await requireOwner();
  if ((session.user as any).businessId !== businessId) {
    redirect('/login');
  }
  return session;
}

export function getSessionBusinessId(session: any): string {
  const businessId = session?.user?.businessId;
  if (!businessId) throw new Error('No business ID in session');
  return businessId;
}

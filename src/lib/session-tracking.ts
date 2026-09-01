import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { getDeviceType, hashIP } from './utils';
import { sanitizeText } from './security';

const allowedSourceTypes = new Set(['business_qr', 'business_nfc', 'employee_qr', 'employee_nfc']);

export async function createSession({
  businessId,
  employeeId,
  sourceType,
  userAgent,
  ip,
}: {
  businessId: string;
  employeeId?: string;
  sourceType: string;
  userAgent?: string;
  ip?: string;
}) {
  const cleanedBusinessId = sanitizeText(businessId, 120);
  const cleanedEmployeeId = employeeId ? sanitizeText(employeeId, 120) : null;
  const cleanedSourceType = sanitizeText(sourceType, 40);
  const cleanedUserAgent = userAgent ? sanitizeText(userAgent, 255) : undefined;
  const cleanedIp = ip ? sanitizeText(ip, 50) : undefined;

  if (!cleanedBusinessId || !cleanedSourceType || !allowedSourceTypes.has(cleanedSourceType)) {
    throw new Error('Invalid session input');
  }

  const sessionToken = uuidv4();
  const deviceType = cleanedUserAgent ? getDeviceType(cleanedUserAgent) : undefined;
  const ipHash = cleanedIp ? hashIP(cleanedIp) : undefined;

  const session = await db.session.create({
    data: {
      businessId: cleanedBusinessId,
      employeeId: cleanedEmployeeId || null,
      sessionToken,
      sourceType: cleanedSourceType,
      deviceType,
      userAgent: cleanedUserAgent,
      ipHash,
    },
  });

  // Also create a scan record
  await db.scan.create({
    data: {
      businessId: cleanedBusinessId,
      employeeId: cleanedEmployeeId || null,
      sessionId: session.id,
      sourceType: cleanedSourceType,
      deviceInfo: cleanedUserAgent,
      ipHash,
    },
  });

  return session;
}

export async function completeSession(sessionId: string) {
  const cleanedSessionId = sanitizeText(sessionId, 120);
  if (!cleanedSessionId) {
    throw new Error('Invalid session ID');
  }

  await db.session.update({
    where: { id: cleanedSessionId },
    data: { completedAt: new Date() },
  });
}

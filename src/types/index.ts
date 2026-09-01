import type { Business, Employee, Subscription, User } from '@prisma/client';

export type UserRole = 'admin' | 'business_owner';

export type BusinessStatus = 'active' | 'suspended' | 'expired';
export type EmployeeStatus = 'active' | 'inactive';
export type SubscriptionPlan = 'monthly' | '6month' | '12month';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended';
export type FeedbackStatus = 'unread' | 'read' | 'resolved';
export type QrType = 'business_qr' | 'business_nfc' | 'employee_qr' | 'employee_nfc';
export type SourceType = 'business_qr' | 'business_nfc' | 'employee_qr' | 'employee_nfc';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessId: string | null;
  businessSlug: string | null;
}

export interface BusinessWithSubscription extends Business {
  subscriptions: Subscription[];
}

export interface EmployeeWithStats extends Employee {
  _count?: {
    ratings: number;
  };
  avgBehaviour?: number;
  avgFastness?: number;
  avgOverall?: number;
}

export interface DashboardStats {
  totalScans: number;
  uniqueVisitors: number;
  reviewPageVisits: number;
  googleClicks: number;
  aiGenerated: number;
  privateFeedback: number;
  employeeInteractions: number;
  avgEmployeeRating: number;
  activeEmployees: number;
  previousPeriod: {
    totalScans: number;
    uniqueVisitors: number;
    googleClicks: number;
    aiGenerated: number;
    privateFeedback: number;
  };
}

export interface AnalyticsFilter {
  startDate: Date;
  endDate: Date;
  employeeId?: string;
  sourceType?: SourceType;
}

export const PLAN_DETAILS: Record<SubscriptionPlan, { name: string; amount: number; duration: string }> = {
  monthly: { name: 'Monthly', amount: 1500, duration: '1 Month' },
  '6month': { name: '6 Months', amount: 7000, duration: '6 Months' },
  '12month': { name: '12 Months', amount: 11000, duration: '12 Months' },
};

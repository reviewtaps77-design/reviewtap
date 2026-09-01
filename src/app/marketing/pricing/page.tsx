import Link from 'next/link';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  'Unlimited Scans & Reviews',
  'QR Codes for Business & Staff',
  'AI Review Assistant',
  'Private Feedback Capture',
  'Real-Time Analytics Dashboard',
  'Employee Performance Tracking',
  'Custom Branding (Logo & Colors)',
  'Zero Hidden Transaction Fees',
];

const plans = [
  {
    name: 'Monthly',
    price: '₹1,500',
    period: '/month',
    description: 'Perfect for trying out ReviewTap at your business location.',
    features: features,
    badge: null,
  },
  {
    name: '6 Months',
    price: '₹7,000',
    period: '/6 months',
    description: 'Commit longer and save on setup costs.',
    features: features,
    badge: 'Save ₹2,000',
  },
  {
    name: '12 Months',
    price: '₹11,000',
    period: '/year',
    description: 'Our most popular plan for sustained reputation growth.',
    features: features,
    badge: 'BEST VALUE - Save ₹7,000',
    popular: true,
  }
];

const faqs = [
  { q: "What is ReviewTap?", a: "ReviewTap is a multi-tenant SaaS platform that helps local businesses collect authentic Google reviews, private feedback, and track staff performance using NFC cards and QR codes." },
  { q: "How does the QR/NFC system work?", a: "Customers simply scan a QR code or tap an NFC card with their smartphone to be instantly directed to your custom review page. No apps required." },
  { q: "Can I track individual employees?", a: "Yes! You can generate unique QR codes for each employee to track their individual performance metrics like behavior, service speed, and customer satisfaction." },
  { q: "What is the AI Review Assistant?", a: "Our AI helps customers draft natural, authentic reviews in seconds based on a few quick answers about their visit." },
  { q: "Is customer data private?", a: "Yes, customers do not need to create an account, and private feedback is strictly delivered to business management." },
  { q: "How do I get my QR codes?", a: "You can download high-resolution print-ready PNG and SVG codes directly from your dashboard immediately after onboarding." },
  { q: "Can I customize my review page?", a: "Absolutely. You can add your business logo, custom brand color, address, and Google Review URL." },
  { q: "What happens when my subscription expires?", a: "Your historical review analytics and staff data remain safely stored. Scans will display a renewal notice until reactivated by the administrator." },
  { q: "How do I renew my subscription?", a: "ReviewTap uses simple manual subscription management without payment gateway auto-debits. Simply contact our admin or support team to renew or extend your plan." }
];

export default function PricingPage() {
  return (
    <div className="bg-slate-50 py-24 sm:py-32 font-sans">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Simple & Transparent Plans</h2>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Choose the right plan for your business
          </p>
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base text-slate-600">
          All plans include complete access to every feature, unlimited scans, AI review generation, and individual staff QR codes.
        </p>

        <div className="isolate mx-auto mt-14 grid max-w-md grid-cols-1 gap-y-8 sm:mt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col justify-between rounded-3xl p-2 ${
                plan.popular
                  ? 'border-2 border-primary shadow-xl scale-105 z-10 bg-white ring-4 ring-primary/10'
                  : 'border border-slate-200/80 bg-white shadow-sm'
              }`}
            >
              <CardHeader className="p-6 pb-2">
                {plan.badge && (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold mb-4 w-fit ${
                      plan.popular ? 'bg-primary text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}
                <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold tracking-tight text-slate-900">
                  {plan.price}
                  <span className="text-sm font-semibold tracking-normal text-slate-500 ml-1">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="w-full h-px bg-slate-100 mb-6" />
                <ul role="list" className="space-y-3 text-xs leading-5 text-slate-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-x-2.5">
                      <Check className="h-4 w-4 flex-none text-primary font-bold" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex flex-col gap-2">
                <Button className="w-full h-11 rounded-xl font-bold" variant={plan.popular ? 'default' : 'outline'} asChild>
                  <Link href="/contact">Get Started</Link>
                </Button>
                <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
                  <Info className="h-3 w-3" /> No checkout required • Activated by admin
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <div className="mx-auto max-w-3xl mt-28">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-500 mt-1">Everything you need to know about ReviewTap</p>
          </div>
          <Accordion type="single" collapsible className="w-full bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold text-sm text-slate-800">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-xs text-slate-600 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

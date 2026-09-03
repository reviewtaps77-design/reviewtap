import { CheckCircle2, QrCode, ShieldCheck, TrendingUp, Smartphone, SmilePlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import scanImage from '../../../../Images/1.png';
import brandedImage from '../../../../Images/2.png';
import ratingImage from '../../../../Images/3.png';
import reviewImage from '../../../../Images/4.png';
import insightsImage from '../../../../Images/5.png';

const steps = [
  {
    icon: <QrCode className="h-8 w-8 text-primary" />,
    image: scanImage,
    title: '1. Customer Taps or Scans',
    description: 'At checkout or service completion, customer simply taps your NFC card or scans a unique QR code. No apps to download.',
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    image: brandedImage,
    title: '2. Branded Experience',
    description: 'They land on a custom, branded webpage with your logo and colors. If it was an employee QR, the employee name is displayed.',
  },
  {
    icon: <SmilePlus className="h-8 w-8 text-primary" />,
    image: ratingImage,
    title: '3. Rate the Experience',
    description: 'Customers quickly rate employee behavior, service speed, and provide an overall rating out of 5 stars.',
  },
  {
    icon: <Smartphone className="h-8 w-8 text-primary" />,
    image: reviewImage,
    title: '4. AI Review or Private Feedback',
    description: 'If positive, our AI suggests a great Google review. If negative, they are directed to a private feedback form instead of a public rant.',
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-primary" />,
    image: insightsImage,
    title: '5. Insights and Growth',
    description: 'Watch your 5-star reviews climb on Google while accessing a dashboard of real-time insights and employee performance.',
  }
];

export default function HowItWorksPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            How ReviewTap Works
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            A seamless process to turn happy customers into public advocates, while capturing actionable feedback privately.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className={`flex flex-col md:flex-row items-center gap-12 mb-20 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-6">
                  {step.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h2>
                <p className="text-lg text-gray-600 leading-relaxed">{step.description}</p>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="relative w-full max-w-sm aspect-square rounded-3xl shadow-inner border overflow-hidden">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 384px"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center bg-gray-50 rounded-3xl p-12 max-w-4xl mx-auto border">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Start growing your reviews today</h2>
          <Button size="lg" className="rounded-full px-8 h-14 text-base" asChild>
            <Link href="/pricing">View Pricing Options</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

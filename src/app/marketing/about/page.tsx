import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            About ReviewTap
          </h1>
          <p className="text-lg leading-8 text-gray-600">
            We are on a mission to help local businesses build the reputation they deserve.
          </p>
        </div>

        <div className="mt-16 space-y-12 text-base leading-7 text-gray-700">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">The Problem</h2>
            <p className="mb-4">
              Local businesses deliver amazing experiences every day, but capturing those moments in the form of online reviews is incredibly hard. Customers are busy, and writing a good review takes effort. Often, only unhappy customers take the time to leave public feedback, skewing a business's true reputation.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">The Solution</h2>
            <p className="mb-4">
              ReviewTap was built to remove friction from the review process. By combining NFC technology, custom QR codes, and a smart AI assistant, we make leaving a detailed, 5-star review as easy as a single tap.
            </p>
            <p>
              We also realized businesses need more than just reviews—they need insights. That's why ReviewTap includes private feedback capture and employee-level tracking, turning customer interactions into actionable data for growth.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">Our Mission</h2>
            <p>
              To empower offline businesses with modern tools to seamlessly manage their online reputation, improve their services, and ultimately drive more revenue through trust.
            </p>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <Button size="lg" asChild>
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

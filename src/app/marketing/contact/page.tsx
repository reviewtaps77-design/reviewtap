import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          
          {/* Contact Info Sidebar */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6">
              Get in touch
            </h2>
            <p className="text-lg leading-8 text-gray-600 mb-12">
              Ready to set up your account or have a question? Fill out the form and our team will get back to you within 24 hours.
            </p>

            <dl className="space-y-8 text-base leading-7 text-gray-600">
              <div className="flex gap-x-4">
                <dt className="flex-none">
                  <span className="sr-only">Email</span>
                  <Mail className="h-7 w-6 text-gray-400" aria-hidden="true" />
                </dt>
                <dd>
                  <a className="hover:text-gray-900" href="mailto:reviewtaps77@gmail.com">
                    reviewtaps77@gmail.com
                  </a>
                </dd>
              </div>
              <div className="flex gap-x-4">
                <dt className="flex-none">
                  <span className="sr-only">Phone</span>
                  <Phone className="h-7 w-6 text-gray-400" aria-hidden="true" />
                </dt>
                <dd>
                  <a className="hover:text-gray-900" href="tel:+919876543210">
                    +91 98765 43210
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-8 sm:p-10 rounded-3xl border border-gray-200">
            <form action="#" method="POST" className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="mt-2">
                  <Input type="text" name="name" id="name" autoComplete="name" required placeholder="John Doe" />
                </div>
              </div>

              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <div className="mt-2">
                  <Input type="text" name="businessName" id="businessName" required placeholder="Acme Inc" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="mt-2">
                  <Input type="email" name="email" id="email" autoComplete="email" required placeholder="john@example.com" />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="mt-2">
                  <Input type="tel" name="phone" id="phone" autoComplete="tel" required placeholder="+91 98765 43210" />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <div className="mt-2">
                  <Textarea name="message" id="message" rows={4} required placeholder="How can we help you?" />
                </div>
              </div>

              <Button type="submit" className="w-full mt-8" size="lg">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { QrCode, Star, MessageSquare, BarChart3, Users, Smartphone, Shield, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              QR + NFC + AI Powered Reviews
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Turn Every Customer Experience Into a{' '}
              <span className="text-primary">Review</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              ReviewTap makes it effortless for your customers to leave Google reviews. Just a simple QR scan or NFC tap, and our AI assistant helps them craft the perfect review — all while you track employee performance in real time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/pricing">Get Started <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Everything You Need to Grow Reviews</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">From QR codes to AI-powered review generation, ReviewTap gives you the complete toolkit to boost your online reputation.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <QrCode className="h-6 w-6" />, title: 'QR & NFC Codes', desc: 'Generate branded QR codes for your business and each employee. NFC cards use the same smart URLs.' },
              { icon: <Sparkles className="h-6 w-6" />, title: 'AI Review Assistant', desc: 'Our AI helps customers write authentic, detailed Google reviews based on their actual experience.' },
              { icon: <Users className="h-6 w-6" />, title: 'Employee Tracking', desc: 'Track individual employee performance with Behaviour, Fastness, and Overall ratings from customers.' },
              { icon: <BarChart3 className="h-6 w-6" />, title: 'Real-Time Analytics', desc: 'See scans, reviews, feedback, and employee performance trends in your intuitive dashboard.' },
              { icon: <MessageSquare className="h-6 w-6" />, title: 'Private Feedback', desc: 'Capture constructive feedback privately before it becomes a negative public review.' },
              { icon: <Shield className="h-6 w-6" />, title: 'Business Branded', desc: 'Every customer page shows your logo, colors, and branding. ReviewTap stays behind the scenes.' },
            ].map((feature, i) => (
              <Card key={i} className="border-0 shadow-none bg-gray-50 hover:bg-gray-100 transition-colors">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mt-4 text-muted-foreground">Three simple steps to more reviews</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Customer Scans', desc: 'Customer scans your QR code or taps your NFC card at your business location.' },
              { step: '2', title: 'Rate & Review', desc: 'They see your branded page, rate their experience, and our AI helps them write a review.' },
              { step: '3', title: 'You Get Insights', desc: 'Reviews go to Google, feedback comes to you, and analytics power your decisions.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" asChild>
              <Link href="/how-it-works">Learn More <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Grow Your Reviews?</h2>
          <p className="mt-4 text-lg text-blue-100">Join businesses that are turning every customer interaction into a 5-star review.</p>
          <div className="mt-8">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/pricing">View Plans & Get Started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

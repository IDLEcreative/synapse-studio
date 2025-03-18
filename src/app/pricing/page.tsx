import Header from "@/components/landing-header";
import Footer from "@/components/landing-footer";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
            Choose Your Plan
          </h1>

          <p className="text-gray-300 text-lg text-center mb-16 max-w-3xl mx-auto">
            Select the perfect plan for your creative needs. From hobbyists to
            professionals, we have options for everyone. All plans include a
            14-day free trial with no credit card required.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Free Plan */}
            <div className="bg-card/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl hover:translate-y-[-5px]">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-white">$0</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Perfect for hobbyists and beginners
                </p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Basic video editing tools
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      720p export quality
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">5 projects</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Basic AI features
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Community support
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      1GB cloud storage
                    </span>
                  </li>
                </ul>
                <Link href="/app">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-b from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/30 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl hover:translate-y-[-5px] relative">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-white">$19</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
                <p className="text-gray-400 text-sm">
                  For content creators and professionals
                </p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Advanced editing tools
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      4K export quality
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Unlimited projects
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">Full AI suite</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Priority support
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Custom templates
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      50GB cloud storage
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Advanced effects library
                    </span>
                  </li>
                </ul>
                <Link href="/app">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-card/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl hover:translate-y-[-5px]">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white mb-2">
                  Enterprise
                </h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold text-white">$49</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
                <p className="text-gray-400 text-sm">
                  For teams and businesses
                </p>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Everything in Pro
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Team collaboration
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Advanced analytics
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Dedicated support
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      Custom branding
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      500GB cloud storage
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-cyan-400 mr-2 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-300">
                      SSO & advanced security
                    </span>
                  </li>
                </ul>
                <Link href="/app">
                  <Button variant="outline" className="w-full">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Can I switch plans later?
                </h3>
                <p className="text-gray-300">
                  Yes, you can upgrade or downgrade your plan at any time. When
                  upgrading, you'll get immediate access to the new features.
                  When downgrading, the change will take effect at the end of
                  your current billing cycle.
                </p>
              </div>

              <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Is there a limit to how many videos I can create?
                </h3>
                <p className="text-gray-300">
                  There's no limit to the number of videos you can create on any
                  plan. The Free plan limits you to 5 projects, but within those
                  projects, you can create as many videos as you want. Pro and
                  Enterprise plans offer unlimited projects.
                </p>
              </div>

              <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Do you offer educational or non-profit discounts?
                </h3>
                <p className="text-gray-300">
                  Yes, we offer special pricing for educational institutions,
                  non-profit organizations, and students. Please contact our
                  sales team for more information and to verify your
                  eligibility.
                </p>
              </div>

              <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-300">
                  We accept all major credit cards (Visa, Mastercard, American
                  Express, Discover), PayPal, and for Enterprise customers, we
                  can also arrange invoicing for bank transfers.
                </p>
              </div>

              <div className="bg-card/30 backdrop-blur-sm border border-white/10 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  Can I cancel my subscription at any time?
                </h3>
                <p className="text-gray-300">
                  Yes, you can cancel your subscription at any time from your
                  account settings. When you cancel, you'll still have access to
                  your paid features until the end of your current billing
                  cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

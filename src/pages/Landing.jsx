import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Shield, 
  Globe, 
  CheckCircle,
  Star,
  ArrowRight,
  Play,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Logo from '../components/ui/Logo';

const FeatureCard = ({ icon: Icon, title, description, highlight = false }) => (
  <Card className={`group hover:shadow-lg transition-all duration-300 ${highlight ? 'ring-2 ring-blue-500' : ''}`}>
    <CardContent className="p-6">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${highlight ? 'bg-blue-100' : 'bg-slate-100'} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 ${highlight ? 'text-blue-600' : 'text-slate-600'}`} />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-800">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </CardContent>
  </Card>
);

const TestimonialCard = ({ name, company, text, rating }) => (
  <Card className="h-full">
    <CardContent className="p-6">
      <div className="flex mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-slate-600 mb-4 italic">"{text}"</p>
      <div>
        <p className="font-semibold text-slate-800">{name}</p>
        <p className="text-sm text-slate-500">{company}</p>
      </div>
    </CardContent>
  </Card>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center p-2">
                <Logo
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b684858bed2c24a6e877fb/d96971be7_iCON.png"
                  alt="RDA Invoice"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-5xl font-bold text-slate-900">RDA Invoice</h1>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              Professional Invoice Management
              <span className="block text-blue-600">Made Simple for UAE Businesses</span>
            </h2>
            
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Complete business management solution with UAE VAT compliance, multi-currency support, 
              and professional invoice templates. Built specifically for Middle East businesses.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Dashboard')}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8">
                <Play className="mr-2 w-4 h-4" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 mt-12">
              <Badge variant="secondary" className="px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                UAE VAT Compliant
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Globe className="w-4 h-4 mr-2" />
                Multi-Currency
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Free Trial
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Streamline your billing, manage inventory, track expenses, and stay VAT compliant
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={FileText}
              title="Professional Invoicing"
              description="Create beautiful, customizable invoices with multiple templates. Auto-generate invoice numbers and track payment status."
              highlight={true}
            />
            <FeatureCard
              icon={Shield}
              title="UAE VAT Compliance"
              description="Built-in UAE VAT handling with emirate-specific reporting. Generate compliant tax invoices automatically."
            />
            <FeatureCard
              icon={Users}
              title="Customer Management"
              description="Maintain comprehensive customer database with contact details, payment terms, and transaction history."
            />
            <FeatureCard
              icon={Package}
              title="Inventory Tracking"
              description="Track stock levels, manage products, get low-stock alerts, and maintain accurate inventory records."
            />
            <FeatureCard
              icon={BarChart3}
              title="Advanced Reports"
              description="Generate detailed financial reports including P&L statements, VAT reports, and business analytics."
            />
            <FeatureCard
              icon={Globe}
              title="Multi-Currency Support"
              description="Handle transactions in multiple currencies including AED, USD, EUR, and other regional currencies."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                Why Choose RDA Invoice?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-800">UAE-Specific Features</h3>
                    <p className="text-slate-600">Built specifically for UAE businesses with emirate-wise VAT reporting and TRN management.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Easy Setup</h3>
                    <p className="text-slate-600">Get started in minutes. No complex configuration required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Professional Templates</h3>
                    <p className="text-slate-600">Beautiful, customizable invoice templates that reflect your brand.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-slate-800">Mobile Responsive</h3>
                    <p className="text-slate-600">Manage your business on the go with our mobile-optimized interface.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Invoice #INV-2025-001</span>
                  </div>
                  <div className="space-y-2 text-sm opacity-90">
                    <div className="flex justify-between">
                      <span>Website Development</span>
                      <span>AED 5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (5%)</span>
                      <span>AED 250</span>
                    </div>
                    <div className="border-t border-white/20 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>AED 5,250</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-white/80">Beautiful, professional invoices ready in seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Businesses Across UAE
            </h2>
            <p className="text-xl text-slate-600">
              See what our customers say about RDA Invoice
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Ahmed Al-Mansouri"
              company="Dubai Trading LLC"
              rating={5}
              text="RDA Invoice has simplified our billing process significantly. The UAE VAT compliance features are exactly what we needed."
            />
            <TestimonialCard
              name="Sarah Johnson"
              company="Tech Solutions FZ"
              rating={5}
              text="The multi-currency support and professional templates have helped us expand our business internationally."
            />
            <TestimonialCard
              name="Mohammed Hassan"
              company="Al-Noor Enterprises"
              rating={5}
              text="Easy to use, professional looking invoices, and excellent customer support. Highly recommended!"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              Choose the plan that fits your business needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <Card className="relative">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">$29</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Up to 100 invoices/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>5 users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Basic reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="relative ring-2 ring-blue-500">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600">Most Popular</Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Professional</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">$59</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Unlimited invoices</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>15 users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Advanced reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Custom branding</span>
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">$99</span>
                  <span className="text-slate-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Unlimited users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of UAE businesses that trust RDA Invoice for their billing needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8">
              <Download className="mr-2 w-4 h-4" />
              Download Brochure
            </Button>
          </div>
          <p className="text-blue-200 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                  <Logo
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b684858bed2c24a6e877fb/d96971be7_iCON.png"
                    alt="RDA Invoice"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold">RDA Invoice</span>
              </div>
              <p className="text-slate-400">
                Professional invoice management for modern businesses in the UAE and Middle East.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-400">
              © 2025 RDA Invoice. All rights reserved. Made with ❤️ for UAE businesses.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
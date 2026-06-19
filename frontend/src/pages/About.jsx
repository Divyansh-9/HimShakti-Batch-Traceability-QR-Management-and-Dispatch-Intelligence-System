import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Card from '../components/ui/Card';
import { PackageSearch, QrCode, ShieldCheck } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Navbar />
      
      <main className="flex-grow w-full">
        {/* Hero Section */}
        <section className="bg-surface border-b border-border py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-text-primary sm:text-5xl md:text-6xl tracking-tight">
              End-to-end batch traceability
              <span className="block text-brand mt-2">for Himalayan products</span>
            </h1>
            <p className="mt-6 text-lg text-text-muted max-w-2xl mx-auto">
              Our intelligent system ensures the highest standards of food safety and quality by tracking every single batch from origin processing to final consumer dispatch.
            </p>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-12">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="h-full">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-lg flex items-center justify-center mb-6">
                <PackageSearch className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Batch Lifecycle Tracking</h3>
              <p className="text-text-muted leading-relaxed">
                Monitor the exact status of every jam, pickle, and preserve. Know exactly when a batch was produced and its current shelf-life status.
              </p>
            </Card>
            
            <Card className="h-full">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-lg flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">QR Code Dispatch System</h3>
              <p className="text-text-muted leading-relaxed">
                Generate secure, traceable QR codes for ready-to-dispatch inventory. Scannable links provide full ingredient and origin transparency.
              </p>
            </Card>
            
            <Card className="h-full">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-lg flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">Audit & Compliance</h3>
              <p className="text-text-muted leading-relaxed">
                Automated record-keeping ensures you are always prepared for compliance audits with immutable traceability logs.
              </p>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-surface border-t border-border py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-border z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold border-4 border-surface shadow-sm mb-4">1</div>
                <h4 className="font-bold text-text-primary mb-2">Batch Created</h4>
                <p className="text-sm text-text-muted">Raw materials processed and entered</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold border-4 border-surface shadow-sm mb-4">2</div>
                <h4 className="font-bold text-text-primary mb-2">QR Generated</h4>
                <p className="text-sm text-text-muted">Traceability data linked to batch</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl font-bold border-4 border-surface shadow-sm mb-4">3</div>
                <h4 className="font-bold text-text-primary mb-2">Dispatched</h4>
                <p className="text-sm text-text-muted">Product shipped to distribution</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

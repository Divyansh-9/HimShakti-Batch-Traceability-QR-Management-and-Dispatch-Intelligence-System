import { useState } from 'react';
import Navbar from '../components/Navbar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call for phase 3 verification
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = '/dashboard';
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Navbar />
      
      <main className="flex-grow flex w-full">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
                Manager Login
              </h2>
              <p className="mt-3 text-text-muted">
                Secure access to the traceability dashboard
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <Input 
                  id="email-address" 
                  label="Email Address" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@himshakti.com" 
                  required 
                />
                
                <Input 
                  id="password" 
                  label="Password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-brand focus:ring-brand border-border rounded bg-surface focus:outline-none focus:ring-2 focus:ring-offset-2" />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-text-muted">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-brand hover:text-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand rounded-sm">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Sign in to Dashboard
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-surface-2 rounded-lg border border-border text-center">
                <p className="text-sm text-text-muted">[Auth API integration scheduled for Phase 3]</p>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Branded Panel (Hidden on Mobile/Tablet) */}
        <div className="hidden lg:flex lg:w-1/2 bg-surface-2 border-l border-border relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-brand/5 backdrop-blur-3xl"></div>
          
          <div className="relative z-10 max-w-lg p-12 text-center">
            <div className="w-24 h-24 bg-surface shadow-xl rounded-2xl mx-auto flex items-center justify-center mb-8 border border-border">
              <span className="text-4xl">🏔️</span>
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">Quality from the Himalayas</h3>
            <p className="text-lg text-text-muted leading-relaxed">
              Every jar of jam, every packet of salt. Verified and traced from our local farmers directly to your table.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

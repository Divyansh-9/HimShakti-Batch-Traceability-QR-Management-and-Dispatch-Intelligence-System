import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="relative bg-surface overflow-hidden border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-surface sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-text-primary sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Intelligent Batch</span>{' '}
                <span className="block text-brand xl:inline">Traceability</span>
              </h1>
              <p className="mt-3 text-base text-text-muted sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                End-to-end transparency for HimShakti food processing. Track product origins, manage QR codes, and monitor dispatch readiness with AI-powered insights.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link to="/dashboard" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand hover:bg-brand-hover transition-colors md:py-4 md:text-lg md:px-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand">
                    View Dashboard
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link to="/about" className="w-full flex items-center justify-center px-8 py-3 border border-border text-base font-medium rounded-md text-text-primary bg-surface hover:bg-surface-2 transition-colors md:py-4 md:text-lg md:px-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand">
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-surface-2 flex items-center justify-center border-l border-border">
        <div className="w-64 h-64 bg-surface rounded-full flex items-center justify-center shadow-sm border border-border">
           <span className="text-6xl" aria-hidden="true">🏔️</span>
        </div>
      </div>
    </div>
  );
}

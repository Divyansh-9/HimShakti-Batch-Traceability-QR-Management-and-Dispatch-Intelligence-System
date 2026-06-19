export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto transition-colors">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
            <span className="sr-only">Product</span>
            Product
          </a>
          <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
            <span className="sr-only">Company</span>
            Company
          </a>
          <a href="#" className="text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
            <span className="sr-only">Support</span>
            Support
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-sm text-text-muted">
            &copy; 2026 HimShakti Food Processing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

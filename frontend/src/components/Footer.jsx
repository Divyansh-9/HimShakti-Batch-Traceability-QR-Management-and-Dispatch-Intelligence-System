export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          <a href="#" className="text-gray-400 hover:text-gray-500 transition-colors">
            <span className="sr-only">About</span>
            About
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-500 transition-colors">
            <span className="sr-only">Support</span>
            Support
          </a>
          <a href="#" className="text-gray-400 hover:text-gray-500 transition-colors">
            <span className="sr-only">Contact</span>
            Contact
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; 2026 HimShakti Food Processing. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

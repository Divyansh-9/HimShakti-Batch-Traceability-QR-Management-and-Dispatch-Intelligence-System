import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="bg-white shadow rounded-lg px-6 py-12 sm:px-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">About HimShakti Traceability</h1>
          <div className="prose prose-orange max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-4">
              Welcome to the HimShakti Batch Traceability System. This platform ensures the highest standards 
              of food safety and quality by tracking every batch of our Himalayan products from origin to consumer.
            </p>
            <p className="text-lg leading-relaxed">
              [Placeholder for further company background and system architecture details. Content will be populated 
              in Phase 4 of development.]
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

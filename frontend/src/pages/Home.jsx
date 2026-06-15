import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Card from '../components/Card';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <Hero />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">System Overview</h2>
          <p className="mt-4 text-lg text-gray-500">Monitor batch lifecycles from origin to dispatch.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          <Card 
            title="Recent Batches" 
            description="View the latest batches added to the system. Track their current status and remaining shelf life before dispatch."
            badge="5 Active"
            badgeColor="bg-blue-100 text-blue-800"
          />
          <Card 
            title="AI Advisory Alerts" 
            description="Gemini-powered insights on which batches require immediate dispatch due to approaching expiry dates."
            badge="1 Urgent"
            badgeColor="bg-red-100 text-red-800"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

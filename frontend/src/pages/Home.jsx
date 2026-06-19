import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Navbar />
      <Hero />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-text-primary sm:text-4xl">System Overview</h2>
          <p className="mt-4 text-lg text-text-muted">Monitor batch lifecycles from origin to dispatch.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          <Card 
            header={<div className="flex justify-between items-center"><h3 className="text-lg font-bold text-text-primary">Recent Batches</h3><Badge variant="info">5 Active</Badge></div>}
            isClickable
          >
            <p className="text-text-muted">View the latest batches added to the system. Track their current status and remaining shelf life before dispatch.</p>
          </Card>
          <Card 
            header={<div className="flex justify-between items-center"><h3 className="text-lg font-bold text-text-primary">AI Advisory Alerts</h3><Badge variant="error">1 Urgent</Badge></div>}
            isClickable
          >
            <p className="text-text-muted">Gemini-powered insights on which batches require immediate dispatch due to approaching expiry dates.</p>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

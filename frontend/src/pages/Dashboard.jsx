import { useState } from 'react';
import Navbar from '../components/Navbar';
import Badge from '../components/ui/Badge';
import { Package, Truck, QrCode, LayoutDashboard, Settings, ChevronRight, Menu } from 'lucide-react';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');

  const batches = [
    { id: 'BAT-001', product: 'Organic Apple Jam', status: 'success', statusText: 'Dispatched', date: '2026-06-15' },
    { id: 'BAT-002', product: 'Mango Pickle', status: 'warning', statusText: 'QR Ready', date: '2026-06-16' },
    { id: 'BAT-003', product: 'Mixed Fruit Jam', status: 'pending', statusText: 'Pending', date: 'TBD' },
    { id: 'BAT-004', product: 'Himalayan Pink Salt', status: 'error', statusText: 'Rejected', date: '2026-06-17' },
  ];

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Batches', icon: Package },
    { name: 'QR Management', icon: QrCode },
    { name: 'Dispatch', icon: Truck },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-72px)]">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Rail */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-surface border-r border-border transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col py-6 overflow-y-auto">
            <div className="flex items-center justify-between md:hidden mb-6 px-6">
              <span className="text-xl font-bold text-text-primary">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-text-muted p-2 hover:bg-surface-2 rounded-md">✕</button>
            </div>
            
            <nav className="flex-1 space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = activeItem === item.name;
                const Icon = item.icon;
                return (
                  <button 
                    key={item.name} 
                    onClick={() => { setActiveItem(item.name); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors group ${
                      isActive 
                        ? 'bg-brand/10 text-brand' 
                        : 'text-text-muted hover:bg-surface-2 hover:text-text-primary'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 w-5 h-5 mr-3 ${isActive ? 'text-brand' : 'text-text-muted group-hover:text-text-primary'}`} aria-hidden="true" />
                    {item.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="flex items-center mb-4 sm:mb-0">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden mr-4 p-2 text-text-muted hover:bg-surface-2 rounded-md"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Batch Overview</h1>
            </div>
            <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand">
              + New Batch
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium">Total Batches</p>
                <Package className="w-5 h-5 text-text-muted" aria-hidden="true" />
              </div>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-text-primary">1,245</p>
                <span className="ml-2 text-sm font-medium text-success">+12%</span>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium">Dispatched</p>
                <Truck className="w-5 h-5 text-text-muted" aria-hidden="true" />
              </div>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-text-primary">890</p>
                <span className="ml-2 text-sm font-medium text-success">+5%</span>
              </div>
            </div>
            
            <div className="bg-surface p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm font-medium">Pending QR</p>
                <QrCode className="w-5 h-5 text-text-muted" aria-hidden="true" />
              </div>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-text-primary">355</p>
                <span className="ml-2 text-sm font-medium text-warning">-2%</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface shadow-sm rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-2">
              <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-2">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Batch ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-surface-2 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{batch.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{batch.product}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={batch.status}>{batch.statusText}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">{batch.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand transition-colors inline-block" aria-hidden="true" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const batches = [
    { id: 'BAT-001', product: 'Organic Apple Jam', status: 'Dispatched', qr: 'Yes', date: '2026-06-15' },
    { id: 'BAT-002', product: 'Mango Pickle', status: 'QR Ready', qr: 'Yes', date: '2026-06-16' },
    { id: 'BAT-003', product: 'Mixed Fruit Jam', status: 'Pending', qr: 'No', date: 'TBD' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:w-20 lg:w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col px-3 py-4 space-y-2">
            <div className="flex items-center justify-between md:hidden mb-4 px-2">
              <span className="text-xl font-bold dark:text-white">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 dark:text-gray-400">✕</button>
            </div>
            
            {/* Sidebar Links */}
            {['Dashboard', 'Batches', 'QR Management', 'Settings'].map((item) => (
              <a key={item} href="#" className="flex items-center px-2 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg group">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-md flex-shrink-0"></div>
                <span className="ml-3 lg:block md:hidden block">{item}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden mr-4 text-gray-500 dark:text-gray-400"
                >
                  ☰
                </button>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                  Batch Dashboard
                </h2>
              </div>
              <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
                New Batch
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {['Total Batches: 1,245', 'Dispatched: 890', 'Pending QR: 355'].map((kpi, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{kpi.split(':')[0]}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.split(':')[1]}</p>
                </div>
              ))}
            </div>

            {/* Responsive Table Area */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-100 dark:border-gray-700">
              
              {/* Desktop/Tablet Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Batch ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {batches.map((batch) => (
                      <tr key={batch.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{batch.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{batch.product}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {batch.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{batch.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {batches.map((batch) => (
                    <li key={batch.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{batch.id}</span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {batch.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{batch.product}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Date: {batch.date}</div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

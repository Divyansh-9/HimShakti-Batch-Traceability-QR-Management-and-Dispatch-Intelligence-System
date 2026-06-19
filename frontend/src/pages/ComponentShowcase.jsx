import { useState } from 'react';
import { Button, Input, Modal, Toast, Loader } from '../components/ui';

const ComponentShowcase = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const triggerToasts = () => {
    Toast.success('This is a success message!');
    setTimeout(() => Toast.error('This is an error message!'), 500);
    setTimeout(() => Toast.warning('This is a warning!'), 1000);
    setTimeout(() => Toast.info('This is an info message.'), 1500);
  };

  return (
    <div className="min-h-screen p-8 bg-blue-50 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
      <div className="max-w-4xl mx-auto space-y-12">
        
        <div>
          <h1 className="text-3xl font-bold mb-2">UI Component Showcase</h1>
          <p className="text-blue-500 dark:text-blue-400">Library of reusable components for HimShakti</p>
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 border-blue-200 dark:border-blue-700">Buttons</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-blue-500">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 text-blue-500">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-blue-500">States</h3>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button loading>Loading...</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 border-blue-200 dark:border-blue-700">Inputs</h2>
          <div className="max-w-sm space-y-4">
            <Input 
              label="Standard Input" 
              placeholder="Enter some text..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input 
              label="Error State Input" 
              placeholder="Invalid value..." 
              error="This field is required."
            />
            <Input 
              label="Disabled Input" 
              placeholder="Cannot edit this" 
              disabled
            />
          </div>
        </section>

        {/* Modals & Toasts */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 border-blue-200 dark:border-blue-700">Overlays (Modals & Toasts)</h2>
          <div className="flex gap-4">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Button variant="secondary" onClick={triggerToasts}>Trigger Toasts</Button>
          </div>

          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
          >
            <div className="space-y-4">
              <p>This is a reusable modal component. It traps focus and can be closed via the backdrop or Escape key.</p>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
              </div>
            </div>
          </Modal>
        </section>

        {/* Loaders */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2 border-blue-200 dark:border-blue-700">Loaders</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-medium mb-4 text-blue-500">Spinners</h3>
              <div className="flex items-center gap-8 bg-white dark:bg-blue-800 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                <Loader size="sm" />
                <Loader size="md" />
                <Loader size="lg" />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-4 text-blue-500">Table Skeleton</h3>
              <div className="bg-white dark:bg-blue-800 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                <Loader skeleton />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ComponentShowcase;

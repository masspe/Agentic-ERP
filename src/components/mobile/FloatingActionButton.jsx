import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

export default function FloatingActionButton({ actions = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!actions || actions.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      {/* Individual action buttons */}
      {isExpanded && (
        <div className="space-y-3 mb-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => {
                if (!action.disabled) {
                  action.onClick();
                  setIsExpanded(false);
                }
              }}
              disabled={action.disabled}
              className="w-12 h-12 rounded-full shadow-lg bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
              style={{ transform: `translateY(-${(actions.length - index) * 60}px)` }}
            >
              <action.icon className="w-5 h-5" />
            </Button>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-0"
      >
        {isExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </Button>
    </div>
  );
}
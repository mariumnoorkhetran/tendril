'use client';

import { useState, useEffect } from 'react';
import { api, Tip } from '@/lib/api';

export default function TipsCard() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRandomTip();
  }, []);

  const loadRandomTip = async () => {
    try {
      setLoading(true);
      setError(null);
      const randomTip = await api.getRandomTip();
      setTip(randomTip);
    } catch (error) {
      console.error('Failed to load tip:', error);
      setError('Unable to load tip');
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="bg-[#f3c8dd] rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !tip) {
    return (
      <div className="bg-[#f3c8dd] rounded-lg p-6 shadow-sm">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || 'No tip available'}</p>
          <button
            onClick={loadRandomTip}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3c8dd] rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-semibold text-gray">Hot Tips From Community</h2>
        <button
          onClick={loadRandomTip}
          className="bg-[#795663] hover:bg-[#795663]/90 text-white px-4 py-2 rounded-md text-sm font-medium hover:cursor-pointer"
        >
          New Tip
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Tip Content */}
        <div>
          <p className="text-gray-700 leading-relaxed">
            {tip.content}
          </p>
        </div>
      </div>
    </div>
  );
} 
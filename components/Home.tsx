'use client';

import { useState, useEffect } from 'react';
import StreakDisplay from './StreakDisplay';
import TipsCard from './TipsCard';

export default function Home() {
  const [streakRefreshKey, setStreakRefreshKey] = useState(0);

  // Refresh streak every 30 seconds to keep it updated
  useEffect(() => {
    const interval = setInterval(() => {
      setStreakRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="m-8 max-w-5xl">
      {/* Header Section */}
      <div className="text-gray mb-8">
        <h1 className="text-4xl font-bold">
          Home
        </h1>
        <p className="text-lg text-gray mt-2">
          Welcome to your personal hygiene and wellness dashboard.
        </p>
      </div>

      {/* Streak Display */}
      <div className="mb-8">
        <StreakDisplay refreshKey={streakRefreshKey} />
      </div>

      {/* Tips and Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Wellness Tip */}
        <TipsCard />
        
        {/* Quick Overview */}
        <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray mb-4">
           About Tendril
          </h2>
          <p className="text-gray">
            Manage your tasks, track your calendar, and connect with the community through our forum.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client';

import { useState, useEffect } from 'react';
import { api, StreakSummary } from '@/lib/api';

interface StreakDisplayProps {
  refreshKey?: number;
}

export default function StreakDisplay({ refreshKey = 0 }: StreakDisplayProps) {
  const [streak, setStreak] = useState<StreakSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, [refreshKey]);

  const loadStreak = async () => {
    try {
      setLoading(true);
      const streakData = await api.getStreak();
      setStreak(streakData);
    } catch (error) {
      console.error('Failed to load streak:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="bg-[#f9e4bc] rounded-lg p-4 shadow-sm">
        <div className="animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!streak) {
    return (
      <div className="bg-[#f9e4bc] rounded-lg p-4 shadow-sm">
        <p className="text-gray-500 text-sm">Unable to load streak data</p>
      </div>
    );
  }

  const getStreakStatus = () => {
    if (streak.current_streak === 0) {
      return { text: 'No streak yet', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
    
    if (streak.is_paused) {
      return { text: 'Streak Paused', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    }
    
    return { text: 'Active Streak!', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const status = getStreakStatus();

  return (
    <div className="bg-[#f9e4bc] rounded-lg p-3 shadow-sm">
      <h2 className="text-base font-semibold text-gray mb-2">Your Streak</h2>
      
      <div className="space-y-2">
        {/* Current Streak */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Current Streak:</span>
          <span className="text-sm font-semibold text-gray">
            {streak.current_streak}
            {streak.current_streak > 0 && !streak.is_paused && <span className="ml-1">🔥</span>}
          </span>
        </div>
        
        {/* Conditional Status Message */}
        {streak.is_paused && streak.current_streak > 0 && (
          <div className="text-xs text-orange-600">
            Your streak is resting 😊
          </div>
        )}
      </div>
    </div>
  );
} 
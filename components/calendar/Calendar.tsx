'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from "./DatePicker";
import { api, Task, CalendarDayResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarData, setCalendarData] = useState<CalendarDayResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTasksForDate = async (date: Date) => {
    try {
      setLoading(true);
      const dateString = format(date, 'yyyy-MM-dd');
      const data = await api.getCalendarDay(dateString);
      setCalendarData(data);
    } catch (error) {
      console.error('Failed to load tasks for date:', error);
      setCalendarData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      loadTasksForDate(date);
    } else {
      setCalendarData(null);
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    if (!selectedDate || !task.id) return;

    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      await api.updateTaskCompletion(task.id, dateString, !task.completed);
      
      // Reload tasks for the current date
      await loadTasksForDate(selectedDate);
    } catch (error) {
      console.error('Failed to update task completion:', error);
    }
  };

  // Load today's tasks on component mount
  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    loadTasksForDate(today);
  }, []);

  return (
    <div className="m-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="text-[#4b1535] mb-8">
        <h1 className="text-4xl font-bold">Calendar</h1>
        <p className="text-lg text-gray mt-2">
          View your tasks for any date. Select a date to see what's planned.
        </p>
      </div>

      {/* Calendar Content */}
      <div className="bg-[#f3c8dd] rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray">
            {selectedDate ? `Tasks for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Select a Date to view tasks'}
          </h2>
          <div className="flex items-center gap-2">
            <DatePicker onDateSelect={handleDateSelect} selectedDate={selectedDate} />
            {selectedDate && (
              <Button 
                variant="outline" 
                onClick={() => handleDateSelect(undefined)}
                className="text-white bg-[#795663] hover:bg-[#795663]/90 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray">Loading tasks...</p>
          </div>
        )}

        {!loading && selectedDate && calendarData && (
          <div>
            {/* Completion Statistics */}
              <div className="bg-[#f2e0d2] rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#795663]">{calendarData.total_count}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#795663]">{calendarData.completed_count}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#795663]">{calendarData.completion_rate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            {calendarData.tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray mb-3">Task List</h3>
                <ul className="space-y-3">
                  {calendarData.tasks.map((task) => (
                    <li key={task.id} className={`text-gray bg-[#f2e0d2] flex items-center justify-between p-4 rounded-lg border `}>
                      <div className="flex items-center flex-1">
                        <button
                          onClick={() => toggleTaskCompletion(task)}
                          className={`w-5 h-5 rounded mr-3 flex items-center justify-center cursor-pointer ${
                            task.completed 
                              ? 'bg-[#795663] hover:bg-[#795663]/60' 
                              : 'border-2 border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {task.completed && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </button>
                        <div className="flex-1">
                          <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                              {task.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!loading && !selectedDate && (
          <div className="text-center py-8">
            <p className="text-gray-500">Please select a date to view tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect, useRef } from 'react';
import { api, Task } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  // Debug: Log today's date string
  useEffect(() => {
    const todayString = getTodayDateString();
    const now = new Date();
    console.log('Current date/time:', now.toString());
    console.log('Today\'s date string:', todayString);
    console.log('Date input min attribute will be:', todayString);
    
    // Set min attribute dynamically
    if (dateInputRef.current) {
      dateInputRef.current.min = todayString;
      console.log('Set date input min to:', todayString);
    }
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await api.getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Validate due date - should not be in the past
    if (newTaskDueDate) {
      const selectedDate = new Date(newTaskDueDate + 'T00:00:00'); // Set to start of day
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (selectedDate < today) {
        alert('Due date cannot be in the past. Please select today or a future date.');
        return;
      }
    }

    try {
      const newTask = await api.createTask({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        completed: false,
        due_date: newTaskDueDate || undefined,
      });
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const today = getTodayDateString();
      const newCompletedStatus = !task.completed;
      
      // Use the date-specific completion update for proper streak tracking
      await api.updateTaskCompletion(task.id!, today, newCompletedStatus);
      
      // Update the local task state
      const updatedTask = {
        ...task,
        completed: newCompletedStatus,
        completion_history: {
          ...task.completion_history,
          [today]: newCompletedStatus
        }
      };
      
      setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
      
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTodayDateString = () => {
    const now = new Date();
    // Get local date components to avoid timezone issues
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="m-8 max-w-5xl ">
      {/* Header Section */}
      <div className="text-gray mb-8">
        <h1 className="text-4xl font-bold">
          Tasks
        </h1>
        <p className="text-lg text-gray mt-2">
          Manage your daily hygiene and wellness tasks to maintain a healthy routine.
        </p>
      </div>



      {/* Add New Task Form */}
      <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-2xl font-semibold text-gray mb-4">
          Add New Task
        </h2>
        <form onSubmit={addTask} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500"
              required
            />
          </div>
          <div>
            <textarea
              placeholder="Task description (optional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date (Today or Future)
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500"
                min={getTodayDateString()}
                ref={dateInputRef}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="bg-[#af5f5f] hover:bg-[#af5f5f]/90 w-full">
                Add Task
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Task Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your To-Do List */}
        <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray mb-4">
            Your To-Do List ({pendingTasks.length})
          </h2>
          {loading ? (
            <p className="text-gray">Loading tasks...</p>
          ) : pendingTasks.length === 0 ? (
            <p className="text-gray">No pending tasks!</p>
          ) : (
            <ul className="space-y-3">
              {pendingTasks.map((task) => (
                <li key={task.id} className="text-gray flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center flex-1">
                    <button
                      onClick={() => toggleTask(task)}
                      className="w-4 h-4 border-2 border-gray-600 rounded mr-3 hover:border-gray-400 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500">{task.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {task.due_date && (
                          <span className="text-xs text-gray-500">
                            Due: {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id!)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2 cursor-pointer"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray mb-4">
            Completed Tasks ({completedTasks.length})
          </h2>
          {loading ? (
            <p className="text-gray">Loading tasks...</p>
          ) : completedTasks.length === 0 ? (
            <p className="text-gray">No completed tasks yet!</p>
          ) : (
            <ul className="space-y-3">
              {completedTasks.map((task) => (
                <li key={task.id} className="text-gray flex items-center justify-between p-3 bg-green-50 rounded-md">
                  <div className="flex items-center flex-1">
                    <button
                      onClick={() => toggleTask(task)}
                      className="w-4 h-4 bg-green-500 rounded mr-3 flex items-center justify-center cursor-pointer"
                    >
                      <span className="text-white text-xs">✓</span>
                    </button>
                    <div className="flex-1">
                      <div className="font-medium line-through">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 line-through">{task.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {task.due_date && (
                          <span className="text-xs text-gray-500">
                            Due: {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id!)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2 cursor-pointer"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

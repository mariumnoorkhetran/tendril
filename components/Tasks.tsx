'use client';

import { useState, useEffect, useRef } from 'react';
import { api, Task } from '@/lib/api';
import { Button } from '@/components/ui/button';

const AFFIRMATION_MESSAGES = [
  "Great job! You did it!",
  "Keep up the awesome work!",
  "You're making amazing progress!",
  "Another task down, well done!",
  "You're unstoppable!",
  "Way to go!",
  "You should be proud of yourself!",
  "Fantastic effort!",
  "You crushed it!",
  "Success! Keep going!"
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [affirmation, setAffirmation] = useState<string | null>(null);
  const affirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

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
    setHasAttemptedSubmit(true);
    if (!newTaskTitle.trim()) {
      setTitleError('Task title cannot be empty.');
      return;
    }
    if (!newTaskDueDate) {
      setDateError('Please select a due date from the calendar above.');
      return;
    }

    // Clear previous errors
    setTitleError(null);
    setDateError(null);

    // Validate due date - should not be in the past
    const selectedDate = new Date(newTaskDueDate + 'T00:00:00'); // Set to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (selectedDate < today) {
      setDateError('Due date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      const newTask = await api.createTask({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        completed: false,
        due_date: newTaskDueDate,
      });
      setTasks([...tasks, newTask]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setTitleError(null);
      setDateError(null);
      setHasAttemptedSubmit(false);
    } catch (error: any) {
      console.error('Failed to create task:', error);
      if (error.message?.includes('Due date is required')) {
        setDateError('Please select a due date from the calendar above.');
      } else if (error.message?.includes('cannot be in the past')) {
        setDateError('Due date cannot be in the past. Please select today or a future date.');
      } else {
        setDateError('Failed to create task. Please try again.');
      }
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id!);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskDueDate(task.due_date || '');
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditTaskTitle('');
    setEditTaskDescription('');
    setEditTaskDueDate('');
  };

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!editTaskTitle.trim()) {
      setTitleError('Task title cannot be empty.');
      return;
    }
    if (!editingTaskId) return;

    // Clear previous errors
    setTitleError(null);
    setDateError(null);

    // Validate that due date is required
    if (!editTaskDueDate) {
      setDateError('Please select a due date from the calendar.');
      return;
    }

    // Validate due date - should not be in the past
    const selectedDate = new Date(editTaskDueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setDateError('Due date cannot be in the past. Please select today or a future date.');
      return;
    }

    try {
      const updatedTask = await api.updateTask(editingTaskId, {
        title: editTaskTitle,
        description: editTaskDescription || undefined,
        completed: false,
        due_date: editTaskDueDate,
      });
      
      setTasks(tasks.map(task => 
        task.id === editingTaskId ? updatedTask : task
      ));
      
      setEditingTaskId(null);
      setEditTaskTitle('');
      setEditTaskDescription('');
      setEditTaskDueDate('');
      setTitleError(null);
      setDateError(null);
      setHasAttemptedSubmit(false);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      if (error.message?.includes('Due date is required')) {
        setDateError('Please select a due date from the calendar.');
      } else if (error.message?.includes('cannot be in the past')) {
        setDateError('Due date cannot be in the past. Please select today or a future date.');
      } else {
        setDateError('Failed to update task. Please try again.');
      }
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
      // Show affirmation if marking as completed
      if (newCompletedStatus) {
        const randomMsg = AFFIRMATION_MESSAGES[Math.floor(Math.random() * AFFIRMATION_MESSAGES.length)];
        setAffirmation(randomMsg);
        if (affirmationTimeoutRef.current) clearTimeout(affirmationTimeoutRef.current);
        affirmationTimeoutRef.current = setTimeout(() => setAffirmation(null), 3500);
      }
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
    <div className="m-8 max-w-5xl mx-auto">
      {/* Affirmation Toast */}
      {affirmation && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg bg-[#795663] text-white text-lg font-semibold shadow-lg animate-fade-in">
          <span role="img" aria-label="celebrate">🥳</span> {affirmation}
        </div>
      )}
      {/* Header Section */}
      <div className="text-[#4b1535] mb-8">
        <h1 className="text-4xl font-bold">
          Tasks
        </h1>
        <p className="text-lg text-gray mt-2">
          Manage your daily hygiene and wellness tasks to maintain a healthy routine.
        </p>
      </div>

      {/* Add New Task Form */}
      <div className="bg-[#f3c8dd] rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-2xl font-semibold text-gray mb-4">
          Add New Task
        </h2>
        <form onSubmit={addTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title <span className="text-red-500">*</span> (Required)
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              value={newTaskTitle}
              onChange={(e) => {
                setNewTaskTitle(e.target.value);
                setTitleError(null); // Clear error when user types
              }}
              className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2] ${
                titleError && hasAttemptedSubmit ? 'border-red-500 bg-red-50' : 'border-gray-600'
              }`}
            />
            {titleError && hasAttemptedSubmit && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <span className="mr-1">⚠️</span>
                {titleError}
              </p>
            )}
            {!titleError && !newTaskTitle && hasAttemptedSubmit && (
              <p className="text-gray-500 text-sm mt-1">
                ✏️ Please enter a task title
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Description (optional)
            </label>
            <textarea
              placeholder="Enter task description"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2]"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span> (Required)
              </label>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => {
                  setNewTaskDueDate(e.target.value);
                  setDateError(null); // Clear error when user selects a date
                }}
                className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2] ${
                  dateError && hasAttemptedSubmit ? 'border-red-500 bg-red-50' : 'border-gray-600'
                }`}
                min={getTodayDateString()}
                ref={dateInputRef}
              />
              {dateError && hasAttemptedSubmit && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {dateError}
                </p>
              )}
              {!dateError && !newTaskDueDate && hasAttemptedSubmit && (
                <p className="text-gray-500 text-sm mt-1">
                  📅 Please select a date from the calendar above
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button type="submit" className="bg-[#795663] hover:bg-[#795663]/90 w-full">
                Add Task
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Task Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your To-Do List */}
        <div className="bg-[#f3c8dd] rounded-lg p-6 shadow-sm">
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
                <li key={task.id} className="text-gray p-3 bg-[#f2e0d2] rounded-md">
                  {editingTaskId === task.id ? (
                    // Edit Form
                    <form onSubmit={updateTask} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Title <span className="text-red-500">*</span> (Required)
                        </label>
                        <input
                          type="text"
                          placeholder="Enter task title"
                          value={editTaskTitle}
                          onChange={(e) => {
                            setEditTaskTitle(e.target.value);
                            setTitleError(null); // Clear error when user types
                          }}
                          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2] ${
                            titleError && hasAttemptedSubmit ? 'border-red-500 bg-red-50' : 'border-gray-600'
                          }`}
                        />
                        {titleError && hasAttemptedSubmit && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {titleError}
                          </p>
                        )}
                        {!titleError && !editTaskTitle && hasAttemptedSubmit && (
                          <p className="text-gray-500 text-sm mt-1">
                            ✏️ Please enter a task title
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Description (optional)
                        </label>
                        <textarea
                          placeholder="Enter task description"
                          value={editTaskDescription}
                          onChange={(e) => setEditTaskDescription(e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2]"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date <span className="text-red-500">*</span> (Required)
                        </label>
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={(e) => {
                            setEditTaskDueDate(e.target.value);
                            setDateError(null); // Clear error when user selects a date
                          }}
                          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2] ${
                            dateError && hasAttemptedSubmit ? 'border-red-500 bg-red-50' : 'border-gray-600'
                          }`}
                          min={getTodayDateString()}
                        />
                        {dateError && hasAttemptedSubmit && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {dateError}
                          </p>
                        )}
                        {!dateError && !editTaskDueDate && hasAttemptedSubmit && (
                          <p className="text-gray-500 text-sm mt-1">
                            📅 Please select a date from the calendar above
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="bg-[#795663] hover:bg-[#795663]/90">
                          Save
                        </Button>
                        <Button 
                          type="button" 
                          onClick={cancelEditing}
                          className="bg-gray-500 hover:bg-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Task Display
                    <div className="flex items-center justify-between">
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(task)}
                          className="text-blue-500 hover:text-blue-700 text-sm cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task.id!)}
                          className="text-red-500 hover:text-red-700 text-sm cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="bg-[#f3c8dd] rounded-lg p-6 shadow-sm">
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
                <li key={task.id} className="text-gray p-3 bg-[#f2e0d2] rounded-md">
                  {editingTaskId === task.id ? (
                    // Edit Form
                    <form onSubmit={updateTask} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Task title"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Description (optional)
                        </label>
                        <textarea
                          placeholder="Enter task description"
                          value={editTaskDescription}
                          onChange={(e) => setEditTaskDescription(e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2]"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date (Today or Future)
                        </label>
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={(e) => setEditTaskDueDate(e.target.value)}
                          className="w-full p-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500 bg-[#f2e0d2]"
                          min={getTodayDateString()}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="bg-[#795663] hover:bg-[#795663]/90">
                          Save
                        </Button>
                        <Button 
                          type="button" 
                          onClick={cancelEditing}
                          className="bg-gray-500 hover:bg-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Task Display
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <button
                          onClick={() => toggleTask(task)}
                          className="w-4 h-4 bg-[#795663] rounded mr-3 flex items-center justify-center cursor-pointer"
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(task)}
                          className="text-blue-500 hover:text-blue-700 text-sm cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(task.id!)}
                          className="text-red-500 hover:text-red-700 text-sm cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

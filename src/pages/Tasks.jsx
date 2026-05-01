import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Clock, CheckCircle, AlertCircle, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TaskItem = ({ task, user, fetchTasks, allUsers }) => {
  const [notesList, setNotesList] = useState(task.notes || []);
  const [newNote, setNewNote] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/tasks/${task._id}/status`, { status: newStatus }, config);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status', error);
    }
  };

  const saveNotesToBackend = async (updatedNotes) => {
    try {
      setIsSaving(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/tasks/${task._id}/status`, { notes: updatedNotes }, config);
      fetchTasks();
    } catch (error) {
      console.error('Error saving notes', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = [...notesList, newNote.trim()];
    setNotesList(updatedNotes);
    setNewNote('');
    saveNotesToBackend(updatedNotes);
  };

  const handleDeleteNote = (index) => {
    const updatedNotes = notesList.filter((_, i) => i !== index);
    setNotesList(updatedNotes);
    saveNotesToBackend(updatedNotes);
  };

  const handleStartEdit = (index, text) => {
    setEditingIndex(index);
    setEditNoteText(text);
  };

  const handleSaveEdit = (index) => {
    if (!editNoteText.trim()) return;
    const updatedNotes = [...notesList];
    updatedNotes[index] = editNoteText.trim();
    setNotesList(updatedNotes);
    setEditingIndex(null);
    setEditNoteText('');
    saveNotesToBackend(updatedNotes);
  };

  const handleAssigneeChange = async (newAssignee) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/tasks/${task._id}`, { 
        assignedTo: newAssignee === '' ? null : newAssignee 
      }, config);
      fetchTasks();
    } catch (error) {
      console.error('Error updating assignee', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const isAssignedToMe = task.assignedTo?._id === user._id;
  const canEditStatusAndNotes = user.role === 'Admin' || isAssignedToMe;

  return (
    <li className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start justify-between">
        <div className="flex items-start flex-1">
          <div className="mr-4 mt-1">
            {getStatusIcon(task.status)}
          </div>
          <div className="flex-1 mr-6">
            <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {task.projectId && (
                <span className="bg-gray-100 px-2 py-1 rounded-md">Project: {task.projectId.name}</span>
              )}
              {task.dueDate && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              
              <div className="flex items-center bg-indigo-50 px-2 py-1 rounded-md text-indigo-700">
                <span className="mr-2 font-medium">Assignee:</span>
                {user.role === 'Admin' ? (
                  <select 
                    value={task.assignedTo?._id || ''} 
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="bg-transparent border-b border-indigo-200 focus:outline-none focus:border-indigo-500 py-0.5 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map(u => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  <span>{task.assignedTo ? task.assignedTo.name : 'Unassigned'}</span>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {(isAssignedToMe || notesList.length > 0) && (
              <div className="mt-5 bg-gray-50 p-4 rounded-lg border border-gray-200 max-w-2xl">
                <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Completion Notes</label>
                
                {notesList.length > 0 ? (
                  <ul className="space-y-3 mb-4">
                    {notesList.map((note, index) => (
                      <li key={index} className="bg-white p-3 rounded border border-gray-100 shadow-sm text-sm text-gray-700 flex justify-between items-start group">
                        {editingIndex === index ? (
                          <div className="flex-1 flex gap-2">
                            <input 
                              type="text"
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                            />
                            <button onClick={() => handleSaveEdit(index)} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">Save</button>
                            <button onClick={() => setEditingIndex(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 leading-relaxed">{note}</span>
                            {isAssignedToMe && (
                              <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleStartEdit(index, note)} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                                <button onClick={() => handleDeleteNote(index)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                              </div>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 mb-4 italic">No notes added yet.</p>
                )}

                {isAssignedToMe && (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Add a new note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    />
                    <button 
                      onClick={handleAddNote}
                      disabled={isSaving || !newNote.trim()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center shrink-0">
          <select
            disabled={!canEditStatusAndNotes}
            className={`ml-4 text-sm font-medium rounded-full px-3 py-1 border-2 focus:outline-none 
              ${!canEditStatusAndNotes ? 'opacity-70 cursor-not-allowed' : ''}
              ${task.status === 'Completed' ? 'border-green-200 text-green-700 bg-green-50' : 
                task.status === 'In Progress' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' : 
                'border-gray-200 text-gray-700 bg-gray-50'}`}
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>
    </li>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { user } = useContext(AuthContext);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchTasks();
    if (user.role === 'Admin') {
      fetchProjects();
    }
    fetchUsers();
  }, [user]);

  const fetchTasks = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${API_URL}/api/tasks`, config);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${API_URL}/api/projects`, config);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth`);
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${API_URL}/api/tasks`, { 
        title, 
        description, 
        projectId, 
        assignedTo: assignedTo === '' ? null : assignedTo, 
        dueDate 
      }, config);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setProjectId('');
      setAssignedTo('');
      setDueDate('');
      fetchTasks();
    } catch (error) {
      console.error('Error creating task', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        {user.role === 'Admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" /> New Task
          </button>
        )}
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <TaskItem 
              key={task._id} 
              task={task} 
              user={user} 
              fetchTasks={fetchTasks} 
              allUsers={allUsers} 
            />
          ))}
          {tasks.length === 0 && (
            <li className="p-12 text-center text-gray-500">No tasks found.</li>
          )}
        </ul>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows="2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;

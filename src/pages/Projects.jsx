import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Users, Briefcase } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchUsers();
  }, [user]);

  async function fetchTasks() {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${API_URL}/api/tasks`, config);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    }
  }

  async function fetchProjects() {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`${API_URL}/api/projects`, config);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects', error);
    }
  }

  async function fetchUsers() {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth`);
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users', error);
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${API_URL}/api/projects`, { name, description, members: selectedMembers }, config);
      setShowModal(false);
      setName('');
      setDescription('');
      setSelectedMembers([]);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project', error);
    }
  };

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        {user.role === 'Admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" /> New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          // Compute unique members based on tasks assigned in this project
          const projectTasks = tasks.filter(t => t.projectId?._id === project._id);
          const uniqueAssigneesMap = new Map();
          
          // Add manually assigned project members first
          if (project.members) {
            project.members.forEach(m => uniqueAssigneesMap.set(m._id, m));
          }
          
          // Add users assigned to tasks in this project
          projectTasks.forEach(t => {
            if (t.assignedTo) {
              uniqueAssigneesMap.set(t.assignedTo._id, t.assignedTo);
            }
          });
          
          const uniqueMembers = Array.from(uniqueAssigneesMap.values());

          return (
          <div key={project._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg mr-3">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden">{project.description}</p>
              <div className="flex flex-col text-sm text-gray-500">
                <div className="flex items-center mb-2">
                  <Users className="w-4 h-4 mr-1" /> {uniqueMembers.length} Members
                </div>
                {uniqueMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {uniqueMembers.map(member => (
                      <span key={member._id} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                        {member.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
              Created by {project.createdBy?.name || 'Unknown'}
            </div>
          </div>
        )})}
        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No projects found.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Team Members</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {allUsers.map(u => (
                    <div key={u._id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`user-${u._id}`}
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => toggleMember(u._id)}
                        className="mr-2"
                      />
                      <label htmlFor={`user-${u._id}`} className="text-sm text-gray-700">{u.name} ({u.email})</label>
                    </div>
                  ))}
                </div>
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

export default Projects;

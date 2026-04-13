import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Mail,
  Shield,
  Clock
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/admin/users');
        setUsers(data);
      } catch (e) {
        console.error('Failed to fetch users:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">User Catalog</h2>
          <p className="text-gray-500 font-medium">Manage and audit all registered platform members</p>
        </div>

        <div className="relative group min-w-[300px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-500 group-focus-within:text-accent transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300"
          />
        </div>
      </div>

      <div className="glass rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Member Info</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Platform Role</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Account Status</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Registration</th>
                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-6 h-20 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center text-gray-500 font-medium">
                    No matching users found in the system.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center font-black text-accent text-lg">
                          {user.firstName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white text-base tracking-tight">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-opacity-10 border border-opacity-20 ${
                        user.role === 'admin' ? 'bg-accent text-accent border-accent' : 
                        user.role === 'owner' ? 'bg-success text-success border-success' : 
                        'bg-gray-400 text-gray-400 border-gray-400'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="flex items-center gap-2 text-sm font-bold text-success/80">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                        Active
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-medium tracking-tight">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(user.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

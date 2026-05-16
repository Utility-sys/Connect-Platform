import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  MapPin, 
  CalendarCheck, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="glass shadow-2xl rounded-3xl p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-accent/5 ring-1 ring-white/5">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-4 rounded-2xl bg-${color}/10 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${trend > 0 ? 'text-success' : 'text-danger'}`}>
        {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {Math.abs(trend)}%
      </div>
    </div>
    <div>
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 px-1">{label}</h3>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  </div>
);

// fetchStats: fetch platform totals and format revenue for the KPI cards.
const Overview = () => {
  const [stats, setStats] = useState({
    users: 0,
    venues: 0,
    bookings: 0,
    revenue: 0
  });

  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
        const { data } = await axios.get(`${API_BASE}/admin/stats`);
        
        // Format Revenue for display (e.g., 450000 -> 450K)
        const formatRevenue = (val) => {
          if (val >= 1000) return `LKR ${(val / 1000).toFixed(1)}K`;
          return `LKR ${val}`;
        };

        setStats({
          users:    data.users,
          venues:   data.venues,
          bookings: data.bookings,
          revenue:  formatRevenue(data.revenue)
        });
      } catch (e) {
        console.error('fetchStats Error:', e.message);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10s Heartbeat
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Members" value={stats.users} trend={12} color="accent" />
        <StatCard icon={MapPin} label="Active Venues" value={stats.venues} trend={8} color="success" />
        <StatCard icon={CalendarCheck} label="Reservations" value={stats.bookings} trend={-3} color="warning" />
        <StatCard icon={Activity} label="Gross Volume" value={stats.revenue} trend={24} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-2 glass rounded-3xl p-8 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold tracking-tight mb-1">Growth Analytics</h3>
              <p className="text-sm text-gray-500 font-medium tracking-tight">System activity overview for the last 6 months</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white/5 py-2 px-4 rounded-xl border border-white/5">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                New Users
              </span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6b7280', fontSize: 12, fontWeight: 500}} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', fontFamily: 'Montserrat'}}
                  itemStyle={{color: '#fff', fontWeight: 700}}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health */}
        <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold tracking-tight mb-8">System Health</h3>
          <div className="space-y-6 flex-1">
            <div className="p-5 bg-success/5 border border-success/10 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-success/80 tracking-tight">API Server</span>
                <span className="text-xs font-black text-success uppercase tracking-widest">Active</span>
              </div>
              <div className="w-full bg-success/10 h-1.5 rounded-full overflow-hidden">
                <div className="w-[100%] h-full bg-success rounded-full"></div>
              </div>
            </div>

            <div className="p-5 bg-warning/5 border border-warning/10 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-warning/80 tracking-tight">Database (Cloud)</span>
                <span className="text-xs font-black text-warning uppercase tracking-widest">Connected</span>
              </div>
              <div className="w-full bg-warning/10 h-1.5 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-warning rounded-full"></div>
              </div>
            </div>

            <div className="p-5 bg-accent/5 border border-accent/10 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-accent/80 tracking-tight">CDN Status</span>
                <span className="text-xs font-black text-accent uppercase tracking-widest">Active</span>
              </div>
              <div className="w-full bg-accent/10 h-1.5 rounded-full overflow-hidden">
                <div className="w-[99%] h-full bg-accent rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-gray-500 font-medium">Last full audit: Just now</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

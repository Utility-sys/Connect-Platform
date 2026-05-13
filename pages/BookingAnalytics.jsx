import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, DollarSign, Calendar, Clock } from 'lucide-react';

const BookingAnalytics = () => {
  const data = [
    { name: 'Mon', bookings: 12, revenue: 1200 },
    { name: 'Tue', bookings: 19, revenue: 1900 },
    { name: 'Wed', bookings: 15, revenue: 1500 },
    { name: 'Thu', bookings: 22, revenue: 2200 },
    { name: 'Fri', bookings: 30, revenue: 3000 },
    { name: 'Sat', bookings: 45, revenue: 4500 },
    { name: 'Sun', bookings: 38, revenue: 3800 },
  ];

  const pieData = [
    { name: 'Sports', value: 400 },
    { name: 'Entertainment', value: 300 },
    { name: 'Academic', value: 100 },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white">Booking Intelligence</h2>
        <p className="text-gray-500 font-medium">In-depth analysis of reservation patterns and revenue streams</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Volume */}
        <div className="glass rounded-[32px] p-8 border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-accent w-5 h-5" />
            Weekly Success Volume
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass rounded-[32px] p-8 border border-white/5">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Calendar className="text-success w-5 h-5" />
            Venue Category Demand
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingAnalytics;

import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { AssessmentResult, UserProfile } from '../types';
import { fetchAllAssessments } from '../services/assessmentService';
import { getPendingUsers, updateUserStatus } from '../services/authService';

const STATUS_COLORS = {
  Critical: '#ef4444', // red-500
  Poor: '#f97316',     // orange-500
  Normal: '#eab308',   // yellow-500
  Good: '#22c55e',     // green-500
  Excellent: '#3b82f6' // blue-500
};

const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [data, setData] = useState<AssessmentResult[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'approvals'>('analytics');

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const [assessments, pending] = await Promise.all([
        fetchAllAssessments(),
        getPendingUsers()
      ]);
      setData(assessments);
      setPendingUsers(pending);
      setLoading(false);
    };
    initData();
  }, []);

  // Refresh Pending Users when switching tabs
  useEffect(() => {
    if (activeTab === 'approvals') {
      getPendingUsers().then(setPendingUsers);
    }
  }, [activeTab]);

  const handleApprovalAction = async (userId: string, approve: boolean) => {
    // 1. Update status in DB (Local Storage)
    await updateUserStatus(userId, approve ? 'approved' : 'rejected');
    
    // 2. Refresh list locally
    const updatedList = await getPendingUsers();
    setPendingUsers(updatedList);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mb-4"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Process Data for Charts
  const statusCounts = data.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const trendData = data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
        date: new Date(d.date).toLocaleDateString(),
        score: d.percentage
    }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Administrator Dashboard</h1>
                <p className="text-slate-500">Manage patients and view clinical analytics</p>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Tab Switcher */}
               <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'analytics' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Analytics
                  </button>
                  <button 
                    onClick={() => setActiveTab('approvals')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                      activeTab === 'approvals' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Pending Approvals
                    {pendingUsers.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[1.25rem] text-center">
                        {pendingUsers.length}
                      </span>
                    )}
                  </button>
               </div>

               <button 
                 onClick={onLogout} 
                 className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
               >
                  Sign Out
               </button>
            </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'approvals' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Pending Registrations</h3>
                    <p className="text-sm text-slate-500">Review and authorize new patient accounts.</p>
                </div>
            </div>
            
            {pendingUsers.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl mb-4">✨</div>
                <h3 className="text-slate-700 font-medium text-lg">All Caught Up</h3>
                <p>There are no pending patient approvals at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-medium">
                          <tr>
                              <th className="px-6 py-3">Full Name</th>
                              <th className="px-6 py-3">Authentication ID (Username)</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {pendingUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                                  <td className="px-6 py-4 font-mono text-slate-500">{user.username}</td>
                                  <td className="px-6 py-4">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Needs Approval
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                                      <button 
                                        onClick={() => handleApprovalAction(user.id, true)}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                      >
                                        ✓ Approve
                                      </button>
                                      <button 
                                        onClick={() => handleApprovalAction(user.id, false)}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                      >
                                        ✗ Reject
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
            )}
          </div>
        ) : (
          /* Analytics Tab */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 font-medium">Total Assessments</div>
                    <div className="text-3xl font-bold text-slate-900 mt-2">{data.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 font-medium">Avg Consistency</div>
                    <div className="text-3xl font-bold text-indigo-600 mt-2">
                        {(data.reduce((acc, curr) => acc + curr.consistency_score, 0) / data.length || 0).toFixed(1)}%
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 font-medium">Critical Cases</div>
                    <div className="text-3xl font-bold text-red-600 mt-2">
                        {data.filter(d => d.status === 'Critical').length}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="text-sm text-slate-500 font-medium">Avg Score</div>
                    <div className="text-3xl font-bold text-emerald-600 mt-2">
                        {(data.reduce((acc, curr) => acc + curr.percentage, 0) / data.length || 0).toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Mental Health Status Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#cbd5e1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Patient Score Trends</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Assessments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800">Recent Assessments</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Patient</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Score</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Consistency</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.slice().reverse().slice(0, 10).map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{row.patient_name}</td>
                                    <td className="px-6 py-4">{new Date(row.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{row.percentage.toFixed(1)}%</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${row.status === 'Critical' ? 'bg-red-100 text-red-700' : 
                                              row.status === 'Poor' ? 'bg-orange-100 text-orange-700' :
                                              row.status === 'Normal' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-green-100 text-green-700'}
                                        `}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                                                <div 
                                                    className={`h-1.5 rounded-full ${row.consistency_score < 70 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                                    style={{width: `${row.consistency_score}%`}}
                                                />
                                            </div>
                                            <span className="text-xs">{Math.round(row.consistency_score)}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  AlertTriangle, 
  Users, 
  ClipboardList, 
  Activity,
  TrendingUp,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Activity className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Analyzing enterprise metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Enterprise Dashboard</h1>
          <p className="text-slate-500 text-sm">Real-time overview of global operations and stock health.</p>
        </div>
        <div className="flex gap-2 text-xs font-medium text-slate-400">
          Last updated: {format(new Date(), 'HH:mm:ss')}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Users</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center">
              <span className="text-emerald-500 font-medium">+2</span> new this week
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Stock Items</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStock || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Available in all warehouses</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-amber-100 bg-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.lowStockCount || 0}</div>
            <p className="text-xs text-amber-600/70 mt-1">Critical restock required</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow border-emerald-100 bg-emerald-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
            <p className="text-xs text-emerald-600/70 mt-1">Confirmed sales value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Stock Movement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.movementTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="in" name="Inbound" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="out" name="Outbound" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.movementTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="in" 
                    name="Growth"
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                    activeDot={{r: 6}} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              Operational Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-500">Products Catalog</span>
              <span className="font-bold">{stats?.totalProducts || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-500">Global Orders</span>
              <span className="font-bold">{stats?.totalOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-500">Pending Invoices</span>
              <span className="font-bold">{stats?.totalInvoices || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-indigo-500" />
              Real-time Logs
            </CardTitle>
            <Badge variant="secondary">Live Feed</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 p-3 hover:bg-slate-50/50 rounded-lg transition-colors border-b last:border-0 border-slate-100">
                    <div className={cn(
                      "p-2 rounded-full",
                      log.action === 'CREATE' ? "bg-emerald-100 text-emerald-600" :
                      log.action === 'DELETE' ? "bg-red-100 text-red-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="text-sm font-semibold text-slate-900 truncate">{log.entity}: {log.action}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{format(new Date(log.createdAt), 'HH:mm')}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        By <span className="font-medium">{log.user?.firstName} {log.user?.lastName}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No operation logs yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

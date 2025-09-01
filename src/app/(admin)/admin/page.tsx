'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  completedSessions: number;
  waitingSessions: number;
  pendingReports: number;
  trialUsers: number;
  paidUsers: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Admin access required');
          return;
        }
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-base-content/70">{error}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-base-content/70">Monitor and manage TandemUp</p>
          </div>
          <button 
            onClick={fetchStats}
            className="btn btn-outline btn-sm"
          >
            Refresh
          </button>
        </div>

        {stats && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-primary">
                  <Users className="w-8 h-8" />
                </div>
                <div className="stat-title">Total Users</div>
                <div className="stat-value text-primary">{stats.totalUsers}</div>
                <div className="stat-desc">
                  {stats.activeUsers} active this week
                </div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-secondary">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="stat-title">Sessions</div>
                <div className="stat-value text-secondary">{stats.totalSessions}</div>
                <div className="stat-desc">
                  {stats.completedSessions} completed
                </div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-warning">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="stat-title">Waiting</div>
                <div className="stat-value text-warning">{stats.waitingSessions}</div>
                <div className="stat-desc">sessions need partners</div>
              </div>

              <div className="stat bg-base-100 rounded-lg shadow">
                <div className="stat-figure text-error">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="stat-title">Reports</div>
                <div className="stat-value text-error">{stats.pendingReports}</div>
                <div className="stat-desc">need review</div>
              </div>
            </div>

            {/* Revenue Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title">
                    <TrendingUp className="w-5 h-5" />
                    Subscription Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {stats.paidUsers}
                      </div>
                      <div className="text-sm opacity-70">Paid Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {stats.trialUsers}
                      </div>
                      <div className="text-sm opacity-70">Trial Users</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm opacity-70 mb-2">Conversion Rate</div>
                    <div className="text-lg font-semibold">
                      {stats.totalUsers > 0 
                        ? Math.round((stats.paidUsers / stats.totalUsers) * 100)
                        : 0
                      }%
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title">
                    <CheckCircle className="w-5 h-5" />
                    Session Success Rate
                  </h3>
                  <div className="text-3xl font-bold mb-2">
                    {stats.totalSessions > 0 
                      ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                      : 0
                    }%
                  </div>
                  <div className="text-sm opacity-70 mb-4">
                    of sessions completed successfully
                  </div>
                  <progress 
                    className="progress progress-success w-full" 
                    value={stats.totalSessions > 0 
                      ? (stats.completedSessions / stats.totalSessions) * 100
                      : 0
                    } 
                    max="100"
                  ></progress>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title">
                    <Users className="w-5 h-5" />
                    User Management
                  </h3>
                  <p className="text-sm opacity-70 mb-4">
                    View and manage user accounts, subscriptions, and strikes.
                  </p>
                  <div className="card-actions">
                    <a href="/admin/users" className="btn btn-primary btn-sm">
                      Manage Users
                    </a>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title">
                    <AlertTriangle className="w-5 h-5" />
                    Reports Queue
                  </h3>
                  <p className="text-sm opacity-70 mb-4">
                    Review and handle user reports and violations.
                  </p>
                  <div className="card-actions">
                    <a href="/admin/reports" className="btn btn-warning btn-sm">
                      Review Reports
                      {stats.pendingReports > 0 && (
                        <div className="badge badge-error badge-sm">
                          {stats.pendingReports}
                        </div>
                      )}
                    </a>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title">
                    <Calendar className="w-5 h-5" />
                    Session Monitor
                  </h3>
                  <p className="text-sm opacity-70 mb-4">
                    Monitor active sessions and handle issues.
                  </p>
                  <div className="card-actions">
                    <a href="/admin/sessions" className="btn btn-secondary btn-sm">
                      View Sessions
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
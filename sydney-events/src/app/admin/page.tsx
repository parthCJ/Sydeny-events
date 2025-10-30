'use client';

import { useEffect, useState } from 'react';
import { Users, Bell, TrendingUp, Calendar } from 'lucide-react';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  preferences: any[];
  notifications: any[];
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalNotifications: 0,
    usersWithPreferences: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);

      // Calculate stats
      setStats({
        totalUsers: data.length,
        activeUsers: data.filter((u: User) => u.isActive).length,
        totalNotifications: data.reduce((sum: number, u: User) => sum + u.notifications.length, 0),
        usersWithPreferences: data.filter((u: User) => u.preferences.length > 0).length,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage chatbot users and preferences</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="Total Users"
            value={stats.totalUsers}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Active Users"
            value={stats.activeUsers}
            color="green"
          />
          <StatCard
            icon={<Bell className="w-6 h-6" />}
            title="Notifications"
            value={stats.totalNotifications}
            color="blue"
          />
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="With Preferences"
            value={stats.usersWithPreferences}
            color="pink"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Users</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Username</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Preferences</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Notifications</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-purple-600">@{user.username || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.preferences.length > 0 ? (
                        <PreferencesBadge preferences={user.preferences[0]} />
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{user.notifications.length}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) {
  const colorClasses: any = {
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-gray-600 text-sm mt-1">{title}</div>
    </div>
  );
}

function PreferencesBadge({ preferences }: { preferences: any }) {
  const categories = preferences.categories ? JSON.parse(preferences.categories) : [];
  const priceRange = preferences.priceRange;

  return (
    <div className="flex flex-wrap gap-1">
      {categories.slice(0, 2).map((cat: string) => (
        <span
          key={cat}
          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
        >
          {cat}
        </span>
      ))}
      {priceRange && (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          {priceRange}
        </span>
      )}
    </div>
  );
}

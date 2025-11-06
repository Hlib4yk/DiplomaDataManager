import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface Group {
  id: number;
  name: string;
  created_at: string;
}

interface User {
  id: number;
  group_id: number;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface Photo {
  id: number;
  user_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  created_at: string;
}

interface DatabaseData {
  groups: Group[];
  users: User[];
  photos: Photo[];
}

export default function Admin() {
  const [data, setData] = useState<DatabaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'group' | 'user';
    id: number;
    name: string;
  } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/all');
      if (!response.ok) {
        throw new Error('Failed to load data');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const getGroupName = (groupId: number) => {
    return data?.groups.find(g => g.id === groupId)?.name || `Group ${groupId}`;
  };

  const getUserName = (userId: number) => {
    const user = data?.users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : `User ${userId}`;
  };

  const getUserPhotos = (userId: number) => {
    return data?.photos.filter(p => p.user_id === userId) || [];
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete group');
      }

      showMessage(`Group "${groupName}" deleted successfully`, 'success');
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showMessage(err.message || 'Error deleting group', 'error');
      setDeleteConfirm(null);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      showMessage(`User "${userName}" deleted successfully`, 'success');
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      showMessage(err.message || 'Error deleting user', 'error');
      setDeleteConfirm(null);
    }
  };

  const getUsersInGroup = (groupId: number) => {
    return data?.users.filter(u => u.group_id === groupId) || [];
  };

  const handleCleanupOrphanedPhotos = async () => {
    if (!confirm('This will delete all photos that don\'t have a valid user. Continue?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/cleanup-orphaned-photos', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cleanup orphaned photos');
      }

      showMessage(result.message || `Cleaned up ${result.deletedCount} orphaned photo(s)`, 'success');
      loadData();
    } catch (err: any) {
      showMessage(err.message || 'Error cleaning up orphaned photos', 'error');
    }
  };

  const getOrphanedPhotosCount = () => {
    if (!data) return 0;
    return data.photos.filter(photo => {
      return !data.users.some(user => user.id === photo.user_id);
    }).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={loadData}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Database Admin - Diploma Data Manager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 py-8 px-4">
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold text-white">Database Admin</h1>
              <div className="flex gap-4">
                {getOrphanedPhotosCount() > 0 && (
                  <button
                    onClick={handleCleanupOrphanedPhotos}
                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                    title={`Clean up ${getOrphanedPhotosCount()} orphaned photo(s)`}
                  >
                    🧹 Cleanup Orphaned Photos ({getOrphanedPhotosCount()})
                  </button>
                )}
                <button
                  onClick={loadData}
                  className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  🔄 Refresh
                </button>
                <Link
                  href="/"
                  className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  ← Back to App
                </Link>
              </div>
            </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{message.text}</span>
                  <button
                    onClick={() => setMessage(null)}
                    className="ml-4 text-gray-500 hover:text-gray-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-purple-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-purple-600">{data?.groups.length || 0}</div>
                <div className="text-gray-600">Groups</div>
              </div>
              <div className="bg-indigo-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-indigo-600">{data?.users.length || 0}</div>
                <div className="text-gray-600">Users</div>
              </div>
              <div className="bg-green-100 rounded-lg p-6">
                <div className="text-3xl font-bold text-green-600">{data?.photos.length || 0}</div>
                <div className="text-gray-600">Photos</div>
              </div>
            </div>

            {/* Groups Table */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Groups</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.groups.map((group) => {
                      const userCount = getUsersInGroup(group.id).length;
                      return (
                        <tr key={group.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{group.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(group.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setDeleteConfirm({ type: 'group', id: group.id, name: group.name })}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {data?.groups.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No groups found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Users Table */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Users</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.users.map((user) => {
                      const photoCount = getUserPhotos(user.id).length;
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getGroupName(user.group_id)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.first_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.last_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{photoCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setDeleteConfirm({ 
                                type: 'user', 
                                id: user.id, 
                                name: `${user.first_name} ${user.last_name}` 
                              })}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {data?.users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Photos Table */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Photos</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.photos.map((photo) => (
                      <tr key={photo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{photo.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getUserName(photo.user_id)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{photo.original_name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">{photo.filename}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(photo.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {data?.photos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No photos found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {deleteConfirm.type === 'group' ? 'group' : 'user'}{' '}
              <strong>"{deleteConfirm.name}"</strong>?
              {deleteConfirm.type === 'group' && (
                <span className="block mt-2 text-red-600">
                  This will also delete all users and photos in this group!
                </span>
              )}
              {deleteConfirm.type === 'user' && (
                <span className="block mt-2 text-red-600">
                  This will also delete all photos for this user!
                </span>
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'group') {
                    handleDeleteGroup(deleteConfirm.id, deleteConfirm.name);
                  } else {
                    handleDeleteUser(deleteConfirm.id, deleteConfirm.name);
                  }
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


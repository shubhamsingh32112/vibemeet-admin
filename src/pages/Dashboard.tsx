import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { creatorService } from '../services/creatorService';
import { userService, type User, type PromoteToCreatorDto } from '../services/userService';
import type { Creator, CreateCreatorDto } from '../types/creator';
import CreatorForm from '../components/CreatorForm';
import CreatorList from '../components/CreatorList';
import UserList from '../components/UserList';
import { uploadCreatorProfileImage, deleteCreatorProfileImage } from '../utils/firebaseStorage';

type ViewMode = 'creators' | 'users';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('creators');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // User search state (for promoting users to creators)
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (viewMode === 'creators') {
      loadCreators();
    } else {
      loadUsers();
    }
  }, [viewMode]);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const data = await creatorService.getAll();
      setCreators(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load creators');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.search(undefined, 'all'); // Get all users
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const results = await userService.search(searchQuery.trim(), 'user'); // Only search users (not creators)
      setSearchResults(results);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to search users');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setShowUserSearch(false);
    setShowForm(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handlePromoteToCreator = async (data: PromoteToCreatorDto): Promise<void> => {
    if (!selectedUser) {
      throw new Error('No user selected');
    }
    
    // Guard: Prevent promoting if user is already a creator
    if (selectedUser.isCreator || selectedUser.role === 'creator') {
      throw new Error('User is already a creator');
    }
    
    try {
      await userService.promoteToCreator(selectedUser.id, data);
      await loadCreators();
      await loadUsers(); // Refresh users list too
      setShowForm(false);
      setSelectedUser(null);
      setError('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to promote user to creator';
      throw new Error(errorMessage);
    }
  };

  const handlePromoteFromList = (user: User) => {
    setSelectedUser(user);
    setShowUserSearch(false);
    setShowForm(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreate = async (data: CreateCreatorDto): Promise<Creator> => {
    // This should not be used anymore - use handlePromoteToCreator instead
    // Keeping for backwards compatibility with editing
    try {
      const createdCreator = await creatorService.create(data);
      await loadCreators();
      setShowForm(false);
      setError('');
      return createdCreator;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create creator';
      throw new Error(errorMessage);
    }
  };

  const handleUpdate = async (data: CreateCreatorDto): Promise<void> => {
    if (!editingCreator) return;
    try {
      await creatorService.update(editingCreator.id, data);
      await loadCreators();
      setEditingCreator(null);
      setShowForm(false);
      setError('');
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to update creator');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this creator?')) return;

    try {
      setDeletingId(id);
      await creatorService.delete(id);
      await loadCreators();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete creator');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (creator: Creator) => {
    setEditingCreator(creator);
    setSelectedUser(null);
    setShowUserSearch(false);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCreator(null);
    setSelectedUser(null);
    setShowUserSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleStartPromote = () => {
    setEditingCreator(null);
    setSelectedUser(null);
    setShowUserSearch(true);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-300 text-sm">{user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {showUserSearch ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Search User to Promote</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                    placeholder="Search by username, email, or phone..."
                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearchUsers}
                    disabled={searching}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">Select a user to promote:</p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map((user) => {
                        const isAlreadyCreator = user.isCreator || user.role === 'creator';
                        return (
                          <button
                            key={user.id}
                            onClick={() => !isAlreadyCreator && handleSelectUser(user)}
                            disabled={isAlreadyCreator}
                            className={`w-full p-4 rounded-lg text-left transition ${
                              isAlreadyCreator
                                ? 'bg-gray-700/50 cursor-not-allowed opacity-60'
                                : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-medium">{user.username || 'No username'}</p>
                                  {isAlreadyCreator && (
                                    <span className="px-2 py-0.5 bg-green-600/20 text-green-300 text-xs rounded border border-green-600/30">
                                      Already Creator
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm">{user.email || user.phone || 'No contact info'}</p>
                              </div>
                              {!isAlreadyCreator && (
                                <span className="text-blue-400 text-sm">Select →</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searchQuery && !searching && searchResults.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No users found</p>
                )}

                <button
                  onClick={handleCancel}
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : !showForm ? (
          <>
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-700">
              <div className="flex gap-4">
                <button
                  onClick={() => setViewMode('creators')}
                  className={`px-4 py-2 font-medium transition ${
                    viewMode === 'creators'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Creators
                </button>
                <button
                  onClick={() => setViewMode('users')}
                  className={`px-4 py-2 font-medium transition ${
                    viewMode === 'users'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  All Users
                </button>
              </div>
            </div>

            {viewMode === 'creators' ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-white">Creators</h2>
                  <button
                    onClick={handleStartPromote}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    + Promote User to Creator
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Loading creators...</p>
                  </div>
                ) : (
                  <CreatorList
                    creators={creators}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                  />
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-white">All Users</h2>
                  <button
                    onClick={handleStartPromote}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    + Promote User to Creator
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Loading users...</p>
                  </div>
                ) : (
                  <UserList users={users} onPromote={handlePromoteFromList} />
                )}
              </>
            )}
          </>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingCreator ? 'Edit Creator' : selectedUser ? `Promote ${selectedUser.username || selectedUser.email || 'User'} to Creator` : 'Add New Creator'}
              </h2>
              {selectedUser && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  selectedUser.isCreator || selectedUser.role === 'creator'
                    ? 'bg-yellow-900/30 border-yellow-700'
                    : 'bg-blue-900/30 border-blue-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${
                      selectedUser.isCreator || selectedUser.role === 'creator'
                        ? 'text-yellow-200'
                        : 'text-blue-200'
                    }`}>
                      <strong>Selected User:</strong> {selectedUser.username || 'No username'} ({selectedUser.email || selectedUser.phone || 'No contact'})
                    </p>
                    {(selectedUser.isCreator || selectedUser.role === 'creator') && (
                      <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 text-xs rounded border border-yellow-600/30">
                        Already Creator
                      </span>
                    )}
                  </div>
                </div>
              )}
              <CreatorForm
                onSubmit={editingCreator ? handleUpdate : selectedUser ? handlePromoteToCreator : handleCreate}
                onCancel={handleCancel}
                initialData={editingCreator || undefined}
                isEditing={!!editingCreator}
                selectedUserId={selectedUser?.id}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

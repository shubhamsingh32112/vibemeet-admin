import React from 'react';
import type { User } from '../services/userService';

interface UserListProps {
  users: User[];
  onPromote?: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onPromote }) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No users found</p>
      </div>
    );
  }

  const getRoleBadge = (role: string, isCreator: boolean) => {
    if (isCreator) {
      return (
        <span className="px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded border border-green-600/30">
          Creator
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="px-2 py-1 bg-purple-600/20 text-purple-300 text-xs rounded border border-purple-600/30">
          Admin
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded border border-blue-600/30">
        User
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => {
        const isAlreadyCreator = user.isCreator || user.role === 'creator';
        return (
          <div
            key={user.id}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">
                  {user.username || 'No username'}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  {user.email || user.phone || 'No contact info'}
                </p>
              </div>
              {getRoleBadge(user.role, isAlreadyCreator)}
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </span>
              {onPromote && !isAlreadyCreator && user.role !== 'admin' && (
                <button
                  onClick={() => onPromote(user)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
                >
                  Promote
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserList;

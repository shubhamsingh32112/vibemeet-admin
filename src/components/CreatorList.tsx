import React from 'react';
import type { Creator } from '../types/creator';

interface CreatorListProps {
  creators: Creator[];
  onEdit: (creator: Creator) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

const CreatorList: React.FC<CreatorListProps> = ({
  creators,
  onEdit,
  onDelete,
  deletingId,
}) => {
  if (creators.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No creators found</p>
        <p className="text-sm mt-2">Start by adding your first creator</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creators.map((creator) => (
        <div
          key={creator.id}
          className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition"
        >
          <div className="relative h-48 bg-gray-700">
            <img
              src={creator.photo}
              alt={creator.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://via.placeholder.com/400x300?text=No+Image';
              }}
            />
          </div>
          <div className="p-4">
            <h3 className="text-xl font-semibold text-white mb-2">{creator.name}</h3>
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{creator.about}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {creator.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded"
                >
                  {cat}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-green-400">${creator.price}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(creator)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(creator.id)}
                  disabled={deletingId === creator.id}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition disabled:opacity-50"
                >
                  {deletingId === creator.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CreatorList;

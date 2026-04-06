import React from 'react';
import TagInput from '../TagInput';

const CreateCommunityModal = ({
  show,
  onClose,
  onSubmit,
  communityInterests,
  setCommunityInterests,
  loading,
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white p-6 rounded-2xl w-full max-w-md">
        <h3 className="font-bold text-lg mb-4">Create Community</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Interests</label>
            <TagInput
              tags={communityInterests}
              setTags={setCommunityInterests}
              placeholder="Type interest and press Enter..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <input name="coverImage" type="file" className="w-full p-2 border rounded" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityModal;

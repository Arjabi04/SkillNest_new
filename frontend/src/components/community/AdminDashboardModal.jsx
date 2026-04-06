import React from 'react';

const AdminDashboardModal = ({
  show,
  onClose,
  pendingRequests,
  onApproveCommunity,
  onRejectCommunity,
  onApproveDeletion,
  onRejectDeletion,
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white p-6 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Admin Dashboard</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-bold mb-2">Pending Community Creations</h4>
            <div className="space-y-2">
              {pendingRequests.pendingCreations.map((community) => (
                <div key={community._id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                  <div>
                    <p className="font-bold">{community.name}</p>
                    <p className="text-sm text-gray-600">{community.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onApproveCommunity(community._id)} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                    <button onClick={() => onRejectCommunity(community._id)} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-2">Pending Deletions</h4>
            <div className="space-y-2">
              {pendingRequests.pendingDeletions.map((community) => (
                <div key={community._id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                  <div>
                    <p className="font-bold">{community.name}</p>
                    <p className="text-sm text-gray-600">Requested by: {community.deletionRequestedBy?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onApproveDeletion(community._id)} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                    <button onClick={() => onRejectDeletion(community._id)} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardModal;

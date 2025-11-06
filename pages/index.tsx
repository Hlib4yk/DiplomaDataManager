import { useState, useEffect } from 'react';
import Head from 'next/head';
import GroupsList from '../components/GroupsList';
import CreateGroupModal from '../components/CreateGroupModal';
import UserForm from '../components/UserForm';
import ExportButton from '../components/ExportButton';
import Message from '../components/Message';

export default function Home() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<{ id: number; name: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
      showMessage('Error loading groups', 'error');
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    loadGroups();
    showMessage('Group created successfully!', 'success');
  };

  const handleGroupSelected = (group: { id: number; name: string }) => {
    setSelectedGroup(group);
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
  };

  const handleUserSubmitted = () => {
    showMessage('User added successfully!', 'success');
  };

  return (
    <>
      <Head>
        <title>Diploma Data Manager</title>
        <meta name="description" content="Manage groups, users, and photos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
              Diploma Data Manager
            </h1>
          </header>

          <main className="bg-white rounded-2xl shadow-2xl p-8">
            {message && (
              <Message text={message.text} type={message.type} onClose={() => setMessage(null)} />
            )}

            {!selectedGroup ? (
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-800">Groups</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    + Create Group
                  </button>
                </div>
                <GroupsList groups={groups} onGroupSelect={handleGroupSelected} />
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Add User to {selectedGroup.name}
                  </h2>
                  <button
                    onClick={handleBackToGroups}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    ← Back to Groups
                  </button>
                </div>
                <UserForm
                  groupId={selectedGroup.id}
                  groupName={selectedGroup.name}
                  onSuccess={handleUserSubmitted}
                  onBack={handleBackToGroups}
                />
              </div>
            )}

            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <ExportButton onError={(msg) => showMessage(msg, 'error')} onSuccess={(msg) => showMessage(msg, 'success')} />
            </div>
          </main>
        </div>
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleGroupCreated}
          onError={(msg) => showMessage(msg, 'error')}
        />
      )}
    </>
  );
}


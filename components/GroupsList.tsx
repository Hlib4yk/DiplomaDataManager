interface GroupsListProps {
  groups: Array<{ id: number; name: string }>;
  onGroupSelect: (group: { id: number; name: string }) => void;
}

export default function GroupsList({ groups, onGroupSelect }: GroupsListProps) {
  if (groups.length === 0) {
    return (
      <p className="text-center text-gray-600 py-12 text-lg">
        No groups yet. Create your first group!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {groups.map((group) => (
        <div
          key={group.id}
          onClick={() => onGroupSelect(group)}
          className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white p-6 rounded-lg cursor-pointer transition-all duration-200 transform hover:-translate-y-2 hover:shadow-xl text-center font-bold text-xl"
        >
          {group.name}
        </div>
      ))}
    </div>
  );
}


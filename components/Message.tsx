interface MessageProps {
  text: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Message({ text, type, onClose }: MessageProps) {
  return (
    <div
      className={`mb-6 p-4 rounded-lg border-2 animate-slideIn ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      <div className="flex justify-between items-center">
        <span>{text}</span>
        <button
          onClick={onClose}
          className="ml-4 text-gray-500 hover:text-gray-700 font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
}


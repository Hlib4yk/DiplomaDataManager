import { useState, useRef } from 'react';

interface UserFormProps {
  groupId: number;
  groupName: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function UserForm({ groupId, groupName, onSuccess, onBack }: UserFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(files);

    // Create previews using Promise.all for proper async handling
    const previewPromises = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then((previewUrls) => {
      setPreviews(previewUrls);
    });
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPreviews(newPreviews);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      alert('First name and last name are required');
      return;
    }

    if (photos.length === 0) {
      alert('Please select at least one photo');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('firstName', firstName.trim());
    formData.append('lastName', lastName.trim());
    photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    try {
      const response = await fetch(`/api/groups/${groupId}/users`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit user');
      }

      // Reset form
      setFirstName('');
      setLastName('');
      setPhotos([]);
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Failed to submit user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="mb-6">
        <label htmlFor="firstName" className="block text-gray-700 font-semibold mb-2">
          First Name *
        </label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="lastName" className="block text-gray-700 font-semibold mb-2">
          Last Name *
        </label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="photos" className="block text-gray-700 font-semibold mb-2">
          Photos (multiple allowed) *
        </label>
        <input
          ref={fileInputRef}
          type="file"
          id="photos"
          onChange={handlePhotoChange}
          multiple
          accept="image/*"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 transition-colors"
          required
        />

        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden shadow-md">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}


import React, { useState } from 'react';
import { ProfileData } from '../../types/portfolio';
import { Check, Plus, Trash2 } from 'lucide-react';

interface ProfileEditorProps {
  profile: ProfileData;
  onUpdateProfile: (profile: ProfileData) => void;
  onSuccessNotice?: (msg: string) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onUpdateProfile,
  onSuccessNotice,
}) => {
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [customLinks, setCustomLinks] = useState<Array<{ label: string; url: string }>>(
    profile.customLinks || []
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddLink = () => {
    setCustomLinks([...customLinks, { label: '', url: '' }]);
  };

  const handleRemoveLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, field: 'label' | 'url', value: string) => {
    const updated = [...customLinks];
    updated[index][field] = value;
    setCustomLinks(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedLinks = customLinks.filter((l) => l.label.trim() && l.url.trim());
    const newProfile = {
      ...formData,
      customLinks: cleanedLinks,
    };
    onUpdateProfile(newProfile);
    setSavedSuccess(true);
    if (onSuccessNotice) {
      onSuccessNotice('Thông tin hồ sơ tác giả đã được cập nhật!');
    }
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs max-w-xl">
      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-sm">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thông tin hồ sơ thành công!</span>
        </div>
      )}

      {/* Basic Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-editorial-mono uppercase tracking-wider text-stone-700 font-medium mb-1">
            Tên tác giả / Header Title
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-editorial-serif text-sm italic"
          />
        </div>

        <div>
          <label className="block font-editorial-mono uppercase tracking-wider text-stone-700 font-medium mb-1">
            Chức danh / Nghề nghiệp
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-editorial-mono"
            placeholder="VD: WRITER, CONTENT STRATEGIST..."
          />
        </div>
      </div>

      {/* Contact Links */}
      <div className="space-y-3">
        <h4 className="font-editorial-mono uppercase tracking-wider text-stone-800 font-medium border-b border-stone-200 pb-1">
          Liên hệ & Mạng xã hội (Hiển thị góc trên bên phải)
        </h4>

        <div>
          <label className="block text-stone-600 mb-1">Email liên hệ</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-editorial-mono"
            placeholder="dieploanhuong0209@gmail.com"
          />
        </div>

        <div>
          <label className="block text-stone-600 mb-1">Facebook URL</label>
          <input
            type="url"
            value={formData.facebook || ''}
            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-editorial-mono"
            placeholder="https://facebook.com/..."
          />
        </div>

        {/* Custom links (Substack, Portfolio PDF, etc.) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="font-editorial-mono uppercase text-stone-600 text-[11px]">
              Liên kết mở rộng (Substack, Portfolio PDF...)
            </span>
            <button
              type="button"
              onClick={handleAddLink}
              className="text-stone-900 hover:underline inline-flex items-center gap-1 font-editorial-mono text-[11px] cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm liên kết</span>
            </button>
          </div>

          <div className="space-y-2">
            {customLinks.map((link, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nhãn (VD: Substack)"
                  value={link.label}
                  onChange={(e) => handleLinkChange(idx, 'label', e.target.value)}
                  className="w-32 px-2.5 py-1.5 border border-stone-300 rounded-sm font-editorial-mono text-xs"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-stone-300 rounded-sm font-editorial-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bio / statement */}
      <div>
        <label className="block font-editorial-mono uppercase tracking-wider text-stone-700 font-medium mb-1">
          Giới thiệu ngắn (Bio / Statement)
        </label>
        <textarea
          rows={3}
          value={formData.bio || ''}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full px-3 py-2 border border-stone-300 rounded-sm focus:border-stone-900 focus:outline-hidden font-be-vietnam"
          placeholder="Tuyên ngôn phong cách viết hoặc thông điệp ngắn của bạn..."
        />
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-editorial-mono uppercase tracking-wider rounded-sm cursor-pointer transition-colors"
      >
        Lưu thông tin hồ sơ
      </button>
    </form>
  );
};

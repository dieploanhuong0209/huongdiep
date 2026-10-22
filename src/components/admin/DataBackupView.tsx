import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { Download, Upload, RotateCcw, Check, AlertTriangle, FileJson } from 'lucide-react';
import { PortfolioData } from '../../types/portfolio';

interface DataBackupViewProps {
  onDataReloaded: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const DataBackupView: React.FC<DataBackupViewProps> = ({
  onDataReloaded,
  onSuccessNotice,
}) => {
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleDownloadJSON = () => {
    const jsonString = storage.exportJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onSuccessNotice) onSuccessNotice('Đã tải xuống file sao lưu JSON!');
  };

  const handleDownloadLegacy = () => {
    const json = storage.exportLegacyJSON();
    if (!json) { setImportStatus('Lỗi: Máy này chưa có dữ liệu cũ'); return; }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-legacy-before-supabase.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.importJSON(content);
        if (success) {
          setImportStatus('Nhập dữ liệu thành công!');
          onDataReloaded();
          if (onSuccessNotice) onSuccessNotice('Đã khôi phục dữ liệu từ tệp tin!');
        } else {
          setImportStatus('Lỗi: File JSON không đúng định dạng');
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!importText.trim()) return;
    const success = storage.importJSON(importText);
    if (success) {
      setImportStatus('Nhập dữ liệu JSON thành công!');
      setImportText('');
      onDataReloaded();
      if (onSuccessNotice) onSuccessNotice('Đã nhập dữ liệu mới!');
    } else {
      setImportStatus('Lỗi: Dữ liệu JSON không hợp lệ');
    }
  };

  const handleResetToSample = () => {
    storage.resetToDefault();
    setShowConfirmReset(false);
    onDataReloaded();
    if (onSuccessNotice) onSuccessNotice('Đã khôi phục 10 bài viết mẫu như hình ảnh gốc!');
  };

  return (
    <div className="space-y-6 text-xs max-w-xl">
      {importStatus && (
        <div
          className={`p-3 rounded-sm border ${
            importStatus.startsWith('Lỗi')
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {importStatus}
        </div>
      )}

      {/* 1. Export */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm space-y-2">
        <h4 className="font-editorial-mono uppercase tracking-wider text-stone-800 font-medium flex items-center gap-2">
          <Download className="w-4 h-4 text-stone-600" />
          <span>Sao lưu dữ liệu (Export JSON)</span>
        </h4>
        <p className="text-stone-500">
          Tải toàn bộ bài viết, danh mục, định dạng và thông tin cá nhân về máy tính để lưu trữ an toàn.
        </p>
        <button
          onClick={handleDownloadJSON}
          className="px-4 py-2 bg-white border border-stone-300 hover:border-stone-900 text-stone-800 rounded-sm cursor-pointer flex items-center gap-1.5 transition-colors font-editorial-mono"
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>Tải file backup .json</span>
        </button>
        <button onClick={handleDownloadLegacy}
          className="ml-2 px-4 py-2 bg-white border border-stone-300 text-stone-800 rounded-sm">
          Tải dữ liệu cũ lưu trên máy này
        </button>
      </div>

      {/* 2. Import */}
      <div className="p-4 bg-stone-50 border border-stone-200 rounded-sm space-y-3">
        <h4 className="font-editorial-mono uppercase tracking-wider text-stone-800 font-medium flex items-center gap-2">
          <Upload className="w-4 h-4 text-stone-600" />
          <span>Nhập dữ liệu (Import JSON)</span>
        </h4>
        <p className="text-stone-500">
          Tải lên file backup đã lưu trước đó để cập nhật đồng loạt trang web.
        </p>

        <div>
          <label className="inline-block px-4 py-2 bg-white border border-stone-300 hover:border-stone-900 text-stone-800 rounded-sm cursor-pointer font-editorial-mono transition-colors">
            <span>Chọn file .json từ máy</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-2">
          <label className="block text-stone-600 mb-1">Hoặc dán nội dung JSON vào đây:</label>
          <textarea
            rows={3}
            placeholder="{ 'articles': [...] }"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full p-2 border border-stone-300 rounded-sm font-mono text-[11px] bg-white focus:outline-hidden focus:border-stone-900"
          />
          <button
            onClick={handlePasteImport}
            disabled={!importText.trim()}
            className="mt-2 px-3 py-1.5 bg-stone-900 text-stone-100 rounded-sm hover:bg-stone-800 disabled:opacity-30 cursor-pointer font-editorial-mono"
          >
            Nhập dữ liệu đã dán
          </button>
        </div>
      </div>

      {/* 3. Reset Default */}
      <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-sm space-y-2">
        <h4 className="font-editorial-mono uppercase tracking-wider text-amber-900 font-medium flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-700" />
          <span>Khôi phục mẫu gốc (Reset Default)</span>
        </h4>
        <p className="text-stone-600">
          Đặt lại danh sách về 10 bài viết mẫu đúng như ảnh chụp màn hình yêu cầu (Toyota, L&apos;Oréal, P/S, BIDV, Phú Hưng Securities, Huda Beer, Heineken...).
        </p>

        {showConfirmReset ? (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-red-700 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Bạn có chắc chắn muốn đặt lại?
            </span>
            <button
              onClick={handleResetToSample}
              className="px-3 py-1 bg-red-600 text-white rounded-sm hover:bg-red-700 cursor-pointer font-medium"
            >
              Đồng ý đặt lại
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="px-3 py-1 bg-stone-200 text-stone-700 rounded-sm hover:bg-stone-300 cursor-pointer"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-sm hover:bg-amber-100 cursor-pointer font-editorial-mono transition-colors"
          >
            Khôi phục 10 bài viết mẫu ban đầu
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, CheckCircle2, ShieldAlert, Lock, RefreshCw, Plus, FileCheck, Eye } from 'lucide-react';
import { DocumentItem, DocumentType } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';

interface DocumentVaultProps {
  onOpenDigiLocker: () => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ onOpenDigiLocker }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('income_certificate');
  const [docTitle, setDocTitle] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.documents.list();
      if (res.success && res.documents) {
        setDocuments(res.documents);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileToUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      setFeedback({ type: 'error', message: 'Please select a document file to upload.' });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const res = await apiClient.documents.upload(
        fileToUpload,
        selectedType,
        docTitle || fileToUpload.name
      );

      if (res.success) {
        setFeedback({ type: 'success', message: 'Document encrypted and saved in private vault.' });
        setFileToUpload(null);
        setDocTitle('');
        await fetchDocuments();
      } else {
        setFeedback({ type: 'error', message: res.message || 'Upload failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Document upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this document from your private vault?')) {
      return;
    }

    try {
      const res = await apiClient.documents.delete(id);
      if (res.success) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        setFeedback({ type: 'success', message: 'Document removed from storage.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Could not delete document.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Vault Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Private Citizen Document Vault</h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private Storage
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Uploaded and DigiLocker-imported documents are stored securely with cryptographic SHA-256 checksums.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDigiLocker}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition"
          >
            <FileCheck className="w-4 h-4" />
            Import from DigiLocker
          </button>
          <button
            onClick={fetchDocuments}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <ShieldAlert className="w-4 h-4 flex-shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          Upload Verified Certificate or Proof Document
        </h2>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Document Category</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as DocumentType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="income_certificate">Income Certificate (Revenue Dept)</option>
                <option value="caste_certificate">Caste / Community Certificate</option>
                <option value="ration_card">NFSA Ration Card</option>
                <option value="land_record">RoR / 7/12 Land Record</option>
                <option value="bank_passbook">Bank Passbook / DBT Seeding Proof</option>
                <option value="disability_certificate">UDID Disability Certificate</option>
                <option value="domicile_certificate">Residence / Domicile Certificate</option>
                <option value="aadhaar_card">Aadhaar Card Copy</option>
                <option value="other">Other Supporting Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Custom Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="e.g. Official Tahsildar Income Certificate 2024"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/60 rounded-2xl p-6 text-center transition cursor-pointer"
            onClick={() => document.getElementById('fileUploadInput')?.click()}
          >
            <input
              type="file"
              id="fileUploadInput"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setFileToUpload(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center mb-2">
              <Upload className="w-6 h-6" />
            </div>
            {fileToUpload ? (
              <div>
                <p className="text-xs font-semibold text-emerald-400 font-mono">{fileToUpload.name}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to select file or drag & drop here
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports PDF, JPG, PNG, WEBP (Max 10MB). Uploaded files are private.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !fileToUpload}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Save Document to Private Vault</>}
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-4">Saved Documents in Vault ({documents.length})</h2>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
            <p className="text-xs">Loading encrypted document registry...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400">No documents stored in vault yet.</p>
            <p className="text-[11px] text-slate-600">
              Upload your certificates above or import them directly via DigiLocker.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-medium">Document Title</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Source / Status</th>
                  <th className="pb-3 font-medium">Checksum (SHA-256)</th>
                  <th className="pb-3 font-medium">Uploaded / Issued</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{doc.title}</p>
                          <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                            {doc.originalFileName} ({(doc.fileSize / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 pr-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                        {doc.documentType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 pr-4">
                      {doc.verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          {doc.digilockerDocId ? 'DigiLocker Issued' : 'Verified'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          Self-Uploaded
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pr-4">
                      <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px] block" title={doc.checksumSha256}>
                        {doc.checksumSha256 ? `${doc.checksumSha256.substring(0, 14)}...` : 'Pending'}
                      </span>
                    </td>

                    <td className="py-3.5 pr-4 text-slate-400 text-[11px]">
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                    </td>

                    <td className="py-3.5 text-right space-x-2">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
                          title="View / Download securely via signed token"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

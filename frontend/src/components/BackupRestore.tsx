import React, { useState, useEffect } from "react";

interface BackupRestoreProps {
  getBackendUrl: (path: string) => string;
}

interface Backup {
  id: number;
  filename: string;
  type: string;
  deliveriesCount: number;
  ordersCount: number;
  size: number;
  createdAt: string;
}

interface BackupData {
  version: string;
  timestamp: string;
  deliveries: any[];
  orders: any[];
  counts: {
    deliveries: number;
    orders: number;
  };
}

export default function BackupRestore({ getBackendUrl }: BackupRestoreProps) {
  const [backupStatus, setBackupStatus] = useState<string>("");
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [storedBackups, setStoredBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewBackup, setPreviewBackup] = useState<BackupData | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>("");

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch(getBackendUrl('/backups'));
      if (response.ok) {
        const backups = await response.json();
        setStoredBackups(backups);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    }
  };

  const handleDownloadJSON = async () => {
    try {
      setBackupStatus("Downloading latest backup...");
      setLoading(true);
      
      // Get the most recent stored backup instead of creating a new one
      if (storedBackups.length > 0) {
        const latestBackup = storedBackups[0]; // Most recent backup
        const downloadResponse = await fetch(getBackendUrl(`/backups/${latestBackup.filename}/download`));
        const data = await downloadResponse.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = latestBackup.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setBackupStatus(`✅ Downloaded backup from ${new Date(latestBackup.createdAt).toLocaleString()}: ${latestBackup.deliveriesCount} deliveries, ${latestBackup.ordersCount} orders`);
      } else {
        // No stored backups, create a new one
        const response = await fetch(getBackendUrl('/backups'), {
          method: 'POST'
        });
        
        if (!response.ok) throw new Error('Failed to create backup');
        
        const backup = await response.json();
        
        const downloadResponse = await fetch(getBackendUrl(`/backups/${backup.filename}/download`));
        const data = await downloadResponse.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = backup.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setBackupStatus(`✅ Backup downloaded: ${backup.counts.deliveries} deliveries, ${backup.counts.orders} orders`);
        loadBackups();
      }
    } catch (err) {
      setBackupStatus(`❌ Failed to download backup: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackupNow = async () => {
    try {
      setBackupStatus("Creating backup...");
      setLoading(true);
      const response = await fetch(getBackendUrl('/backups'), {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to create backup');
      
      const backup = await response.json();
      setBackupStatus(`✅ Backup created: ${backup.counts.deliveries} deliveries, ${backup.counts.orders} orders`);
      loadBackups(); // Refresh backup list
    } catch (err) {
      setBackupStatus(`❌ Failed to create backup: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setBackupStatus("Exporting to CSV...");
      const response = await fetch(getBackendUrl('/export/csv'));
      
      if (!response.ok) throw new Error('Failed to export CSV');
      
      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suja-deliveries-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setBackupStatus("✅ CSV exported successfully");
    } catch (err) {
      setBackupStatus(`❌ Failed to export CSV: ${err}`);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setBackupStatus("Exporting to Excel...");
      const response = await fetch(getBackendUrl('/export/excel'));
      
      if (!response.ok) throw new Error('Failed to export Excel');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suja-deliveries-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setBackupStatus("✅ Excel exported successfully");
    } catch (err) {
      setBackupStatus(`❌ Failed to export Excel: ${err}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRestoreFile(e.target.files[0]);
      setBackupStatus("");
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setBackupStatus("❌ Please select a backup file first");
      return;
    }

    if (!confirm("⚠️ This will REPLACE all current data with backup data. Continue?")) {
      return;
    }

    try {
      setBackupStatus("Restoring backup...");
      setLoading(true);
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);
      
      const response = await fetch(getBackendUrl('/restore'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backupData)
      });
      
      if (!response.ok) throw new Error('Failed to restore backup');
      
      const result = await response.json();
      setBackupStatus(`✅ Backup restored: ${result.deliveriesRestored} deliveries, ${result.ordersRestored} orders`);
      setRestoreFile(null);
      
      // Reload page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setBackupStatus(`❌ Failed to restore backup: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!restoreFile) {
      setBackupStatus("❌ Please select a backup file first");
      return;
    }

    try {
      setBackupStatus("Merging backup data...");
      setLoading(true);
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);
      
      const response = await fetch(getBackendUrl('/merge'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backupData)
      });
      
      if (!response.ok) throw new Error('Failed to merge backup');
      
      const result = await response.json();
      setBackupStatus(`✅ Backup merged: ${result.deliveriesAdded} deliveries added, ${result.ordersAdded} orders added`);
      setRestoreFile(null);
      
      // Reload page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setBackupStatus(`❌ Failed to merge backup: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromStored = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore from ${filename}? This will replace all current data!`)) {
      return;
    }

    try {
      setBackupStatus("Restoring backup from database...");
      setLoading(true);
      const response = await fetch(getBackendUrl(`/backups/${filename}/restore`), {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to restore backup');
      
      const result = await response.json();
      setBackupStatus(`✅ Backup restored: ${result.deliveriesRestored} deliveries, ${result.ordersRestored} orders`);
      
      // Reload page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setBackupStatus(`❌ Failed to restore backup: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStored = async (filename: string) => {
    try {
      setBackupStatus("Downloading backup...");
      const response = await fetch(getBackendUrl(`/backups/${filename}/download`));
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setBackupStatus(`✅ Downloaded ${filename}`);
    } catch (err) {
      setBackupStatus(`❌ Failed to download: ${err}`);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Delete backup ${filename}?`)) {
      return;
    }

    try {
      const response = await fetch(getBackendUrl(`/backups/${filename}`), {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete backup');
      
      setBackupStatus(`✅ Deleted ${filename}`);
      loadBackups(); // Refresh list
    } catch (err) {
      setBackupStatus(`❌ Failed to delete: ${err}`);
    }
  };

  const handlePreviewBackup = async (filename: string) => {
    try {
      setBackupStatus("Loading backup preview...");
      const response = await fetch(getBackendUrl(`/backups/${filename}/download`));
      const data = await response.json();
      
      setPreviewBackup(data);
      setPreviewFilename(filename);
      setBackupStatus("");
    } catch (err) {
      setBackupStatus(`❌ Failed to load preview: ${err}`);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Stored Backups List */}
      {storedBackups.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Stored Backups ({storedBackups.length})</h2>
          
          <div className="space-y-3">
            {storedBackups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{backup.filename}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      backup.type === 'automatic' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {backup.type === 'automatic' ? '🤖 Auto' : '👤 Manual'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    📦 {backup.deliveriesCount} deliveries • 📋 {backup.ordersCount} orders • 
                    💾 {formatSize(backup.size)} • 🕐 {formatDate(backup.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreviewBackup(backup.filename)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all text-sm font-bold"
                    disabled={loading}
                  >
                    👁️ Preview
                  </button>
                  <button
                    onClick={() => handleDownloadStored(backup.filename)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-bold"
                    disabled={loading}
                  >
                    ⬇️ Download
                  </button>
                  <button
                    onClick={() => handleRestoreFromStored(backup.filename)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-sm font-bold"
                    disabled={loading}
                  >
                    🔄 Restore
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(backup.filename)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-bold"
                    disabled={loading}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-800">
              <strong>✅ Automatic backups:</strong> Run every 6 hours and are stored in the database. Backups are kept for 15 days.
            </p>
          </div>
        </div>
      )}

      {/* Backup Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">💾 Create & Download Backup</h2>
        
        <div className="mb-6">
          <button
            onClick={handleCreateBackupNow}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 Create Backup Now
          </button>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Creates a snapshot of current data and stores it in the database
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleDownloadJSON}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-4xl mb-2">📄</span>
            <span className="font-bold text-blue-800">JSON Format</span>
            <span className="text-sm text-blue-600 mt-1">Latest backup</span>
          </button>
          
          <button
            onClick={handleDownloadCSV}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-4xl mb-2">📊</span>
            <span className="font-bold text-green-800">CSV Format</span>
            <span className="text-sm text-green-600 mt-1">Spreadsheet compatible</span>
          </button>
          
          <button
            onClick={handleDownloadExcel}
            disabled={loading}
            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-4xl mb-2">📈</span>
            <span className="font-bold text-purple-800">Excel Format</span>
            <span className="text-sm text-purple-600 mt-1">Multiple sheets</span>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Automatic backups run every 6 hours. Click "Create Backup Now" to save current data immediately. All backups are kept for 15 days.
          </p>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🔄 Restore from Backup</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="backup-file"
            />
            <label
              htmlFor="backup-file"
              className="cursor-pointer flex flex-col items-center"
            >
              <span className="text-6xl mb-4">📁</span>
              <span className="text-lg font-bold text-gray-700 mb-2">
                {restoreFile ? restoreFile.name : "Click to select backup file"}
              </span>
              <span className="text-sm text-gray-500">
                Only JSON backup files are supported
              </span>
            </label>
          </div>

          {restoreFile && (
            <div className="flex gap-3">
              <button
                onClick={handleMerge}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-teal-600 transition-all shadow-lg"
              >
                ➕ Merge with Current Data
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
              >
                🔄 Replace All Data
              </button>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>➕ Merge:</strong> Adds backup data to your current data (keeps everything)
            </p>
            <p className="text-sm text-blue-800">
              <strong>🔄 Replace:</strong> Deletes current data and restores only backup data
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Warning:</strong> Always download a backup before restoring! Replace action cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {backupStatus && (
        <div className={`rounded-xl p-4 ${
          backupStatus.startsWith('✅') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : backupStatus.startsWith('❌')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <p className="font-medium">{backupStatus}</p>
        </div>
      )}

      {/* Backup Preview Modal */}
      {previewBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">👁️ Backup Preview</h3>
                <p className="text-sm text-gray-600 mt-1">{previewFilename}</p>
              </div>
              <button
                onClick={() => setPreviewBackup(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-800">{previewBackup.counts.deliveries}</div>
                  <div className="text-sm text-blue-600">Deliveries</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="text-3xl font-bold text-green-800">{previewBackup.counts.orders}</div>
                  <div className="text-sm text-green-600">Orders</div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-3">📦 Deliveries ({previewBackup.deliveries.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previewBackup.deliveries.slice(0, 10).map((delivery: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
                      <div className="font-bold text-gray-800">{delivery.customerName}</div>
                      <div className="text-gray-600">
                        {delivery.chickType} • {delivery.netWeight} kg • {new Date(delivery.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {previewBackup.deliveries.length > 10 && (
                    <div className="text-center text-gray-500 text-sm py-2">
                      ... and {previewBackup.deliveries.length - 10} more deliveries
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3">📋 Orders ({previewBackup.orders.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previewBackup.orders.slice(0, 10).map((order: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200">
                      <div className="font-bold text-gray-800">{order.customerName}</div>
                      <div className="text-gray-600">
                        {order.chickType} • Qty: {order.quantity} • Status: {order.status}
                      </div>
                    </div>
                  ))}
                  {previewBackup.orders.length > 10 && (
                    <div className="text-center text-gray-500 text-sm py-2">
                      ... and {previewBackup.orders.length - 10} more orders
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  handleRestoreFromStored(previewFilename);
                  setPreviewBackup(null);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
              >
                🔄 Restore This Backup
              </button>
              <button
                onClick={() => setPreviewBackup(null)}
                className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

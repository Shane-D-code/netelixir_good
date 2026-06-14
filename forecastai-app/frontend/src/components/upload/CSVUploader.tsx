import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForecastStore } from '../../store/forecastStore';
import { useUploadPreview } from '../../hooks/useForecast';
import { parseCSVPreview } from '../../utils/validators';
import { classNames } from '../../utils/formatters';
import { UploadPreview } from '../../types';

export default function CSVUploader() {
  const [dragError, setDragError] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const uploadPreviewMutation = useUploadPreview();
  const setUploadPreview = useForecastStore((s) => s.setUploadPreview);
  const setUploadedFile = useForecastStore((s) => s.setUploadedFile);
  const setError = useForecastStore((s) => s.setError);
  const error = useForecastStore((s) => s.error);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setDragError(null);
      setError(null);

      const file = acceptedFiles[0];
      if (!file) {
        setDragError('No file selected');
        return;
      }

      if (!file.name.endsWith('.csv')) {
        setDragError('Only CSV files are accepted');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setDragError('File size must be less than 10MB');
        return;
      }

      setFileName(file.name);
      setUploadedFile(file);

      uploadPreviewMutation.mutate(file, {
        onSuccess: (data) => {
          setPreview(data);
          setUploadPreview(data);
        },
        onError: (err: Error) => {
          setDragError(err.message);
        },
      });
    },
    [setUploadPreview, setUploadedFile, setError, uploadPreviewMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={classNames(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200',
          isDragActive
            ? 'border-dark-100 bg-accent/5'
            : 'border-dark-650 bg-white/50 hover:border-dark-600 hover:bg-white/70'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={classNames(
              'flex h-14 w-14 items-center justify-center rounded-full transition-colors',
              isDragActive ? 'bg-accent/20' : 'bg-dark-800/50'
            )}
          >
            <svg
              className={classNames(
                'h-6 w-6 transition-colors',
                isDragActive ? 'text-dark-100' : 'text-dark-300'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              or click to browse &middot; CSV format with date, revenue, channel columns
            </p>
          </div>
          {fileName && (
            <span className="Badge">{fileName}</span>
          )}
        </div>
      </div>

      {(dragError || error) && (
        <div className="rounded-lg p-3 text-sm" style={{ border: '1px solid var(--error)', background: 'rgba(178, 59, 59, 0.05)', color: 'var(--error)' }}>
          {dragError || error}
        </div>
      )}

      {uploadPreviewMutation.isPending && (
        <div className="flex items-center justify-center py-4">
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Analyzing file...</span>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="dark-card">
              <p className="label">Rows</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-on-dark)' }}>{preview.row_count.toLocaleString()}</p>
            </div>
            <div className="dark-card">
              <p className="label">Channels</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-on-dark)' }}>{preview.channels_found.join(', ')}</p>
            </div>
            <div className="dark-card">
              <p className="label">Date Range</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-on-dark)' }}>
                {preview.date_range.min} - {preview.date_range.max}
              </p>
            </div>
            <div className="dark-card">
              <p className="label">Total Revenue</p>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-on-dark)' }}>
                ${(preview.total_revenue / 1000).toFixed(1)}K
              </p>
            </div>
          </div>

          {preview.missing_columns.length > 0 && (
            <div className="rounded-lg p-3 text-sm" style={{ border: '1px solid var(--warning)', background: 'rgba(183, 101, 26, 0.05)', color: 'var(--warning)' }}>
              Missing columns: {preview.missing_columns.join(', ')}
            </div>
          )}

          {preview.preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-hover)' }}>
                    {Object.keys(preview.preview[0]).map((col) => (
                      <th key={col} className="px-4 py-2 font-medium"> {col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: 'var(--border-divider)' }}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-2">
                          {String(val).slice(0, 30)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

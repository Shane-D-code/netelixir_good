import api from '../../../services/api.service';
import { ForecastAccuracy, CompareForecastRequest } from '../../../shared/types';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportAPI = {
  exportForecast: async (id: string, format: 'csv' | 'json') => {
    const response = await api.get(`/forecast/export/${id}/${format}`, {
      responseType: 'blob',
    });
    const contentDisposition = String(response.headers['content-disposition'] || '');
    const filenameMatch = contentDisposition.match(/filename="?(.+?)"?;?$/);
    const filename = filenameMatch?.[1] || `forecast_${id}.${format}`;
    downloadBlob(response.data, filename);
    return true;
  },

  compareForecast: async (params: CompareForecastRequest): Promise<ForecastAccuracy> => {
    const response = await api.post('/forecast/compare', params);
    return response.data;
  },
};

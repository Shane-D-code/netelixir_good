import api from '../../../services/api.service';
import { Holiday } from '../../../shared/types';

export const holidayAPI = {
  getHolidays: async (year?: number): Promise<Holiday[]> => {
    const params = year ? { year } : undefined;
    const response = await api.get('/holidays', { params });
    return response.data.holidays;
  },

  getUpcomingHolidays: async (days: number = 30): Promise<Holiday[]> => {
    const response = await api.get('/holidays/upcoming', {
      params: { days },
    });
    return response.data.holidays;
  },

  checkHoliday: async (date: string): Promise<{ isHoliday: boolean; holiday?: Holiday }> => {
    const response = await api.get(`/holidays/check/${date}`);
    return response.data;
  },
};

import { formatDate } from './formatDate';

export const getTodayRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return {
    start,
    end,
    dateLabel: formatDate(today),
  };
};

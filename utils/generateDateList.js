export const generateDateList = (startDate, endDate, time) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const result = [];

  while (start <= end) {
    const dateStr = start.toISOString().split("T")[0]; // Get YYYY-MM-DD
    result.push(`${dateStr} ${time}`);
    start.setDate(start.getDate() + 1);
  }

  return result;
};

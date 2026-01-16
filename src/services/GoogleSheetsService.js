const API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getEnvValue = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

export const getSpreadsheetId = () =>
  getEnvValue('VITE_GOOGLE_SPREADSHEET_ID') || getEnvValue('GOOGLE_SPREADSHEET_ID');

const getAuthHeaders = (accessToken) => {
  if (!accessToken) {
    throw new Error('Missing Google OAuth access token.');
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

export async function getSheetData({ spreadsheetId, range, accessToken }) {
  const id = spreadsheetId || getSpreadsheetId();
  const url = `${API_BASE_URL}/${id}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(accessToken),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Sheets API error: ${message}`);
  }

  const data = await response.json();
  return data.values || [];
}

export async function appendSheetData({ spreadsheetId, range, values, accessToken }) {
  const id = spreadsheetId || getSpreadsheetId();
  const url = `${API_BASE_URL}/${id}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Sheets API error: ${message}`);
  }

  return response.json();
}

export async function updateSheetData({ spreadsheetId, range, values, accessToken }) {
  const id = spreadsheetId || getSpreadsheetId();
  const url = `${API_BASE_URL}/${id}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(accessToken),
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Sheets API error: ${message}`);
  }

  return response.json();
}

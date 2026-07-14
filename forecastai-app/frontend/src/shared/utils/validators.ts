const VALID_CHANNELS = ['Google Ads', 'Meta Ads', 'Microsoft Ads'];

export function validateCSV(file: File): string | null {
  if (!file.name.endsWith('.csv')) {
    return 'Only CSV files are accepted';
  }
  if (file.size === 0) {
    return 'File is empty';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'File size must be less than 10MB';
  }
  return null;
}

export function parseCSVPreview(content: string): {
  headers: string[];
  rows: Record<string, string>[];
  error: string | null;
} {
  try {
    const lines = content.split('\n').filter((l) => l.trim());
    if (lines.length < 2) {
      return { headers: [], rows: [], error: 'File must contain a header row and at least one data row' };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const requiredColumns = ['date', 'revenue', 'channel'];
    const missing = requiredColumns.filter(
      (col) => !headers.some((h) => h === col)
    );
    if (missing.length > 0) {
      return {
        headers: [],
        rows: [],
        error: `Missing required columns: ${missing.join(', ')}`,
      };
    }

    const rows = lines.slice(1, 6).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });
      return row;
    });

    return { headers, rows, error: null };
  } catch {
    return { headers: [], rows: [], error: 'Failed to parse CSV file' };
  }
}

export function normalizeChannel(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('google') || lower === 'google') return 'Google Ads';
  if (lower.includes('meta') || lower.includes('facebook') || lower === 'meta') return 'Meta Ads';
  if (lower.includes('microsoft') || lower.includes('bing') || lower === 'microsoft') return 'Microsoft Ads';
  return name;
}

export function validateBudget(budget: number): string | null {
  if (budget < 0) return 'Budget cannot be negative';
  if (budget > 100000000) return 'Budget seems unrealistically high';
  return null;
}

export { VALID_CHANNELS };

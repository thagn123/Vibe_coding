export const sanitizeText = (value: string) =>
  value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();

export const normalizeCode = (value: string) =>
  value.replace(/\r\n/g, '\n').trim();

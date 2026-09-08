export const environment = {
  production: true,
  // En producción con SSL/HTTPS, se adapta dinámicamente al protocolo y origen seguro para evitar Mixed Content
  API_BASE_URL: typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? `${window.location.origin}/api`
    : 'http://172.71.10.15:5050/api',
};


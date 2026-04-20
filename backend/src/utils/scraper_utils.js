const logger = require('./logger');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:109.0) Gecko/20100101 Firefox/121.0'
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const randomDelay = (min = 1000, max = 3000) =>
  delay(Math.floor(Math.random() * (max - min + 1)) + min);

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000)
      });

      if (response.status === 429) {
        const waitMs = attempt * 5000;
        logger.warn(`Rate limited en ${url}, esperando ${waitMs}ms...`);
        await delay(waitMs);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }

      return await response.text();
    } catch (err) {
      if (attempt === maxRetries) {
        logger.error(`fetchWithRetry falló después de ${maxRetries} intentos: ${url}`);
        return null;
      }
      await delay(attempt * 2000);
    }
  }
  return null;
}

module.exports = { delay, randomDelay, randomUserAgent, fetchWithRetry };

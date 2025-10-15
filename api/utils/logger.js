
const winston = require('winston');
const { format } = winston;
const { combine, timestamp, printf, colorize } = format;

// Define a simple format that is easy to read in the Vercel logs
const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  // Combine several formats for nice, colorful, timestamped output
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    consoleFormat
  ),
  // Use ONLY the Console transport. This prints logs to the Vercel dashboard.
  transports: [
    new winston.transports.Console()
  ],
});

module.exports = logger;
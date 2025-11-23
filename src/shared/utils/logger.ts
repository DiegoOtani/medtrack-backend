// Sistema de logging estruturado para observabilidade

export interface LogContext {
  userId?: string;
  userEmail?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: any;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage('error', message, context));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  // Métodos específicos para observabilidade
  request(context: LogContext) {
    const { method, url, statusCode, duration, userId, ip } = context;
    this.info(`Request: ${method} ${url}`, {
      statusCode,
      duration,
      userId,
      ip,
      type: 'request',
    });
  }

  auth(message: string, context?: LogContext) {
    this.info(`Auth: ${message}`, { ...context, type: 'auth' });
  }

  medication(message: string, context?: LogContext) {
    this.info(`Medication: ${message}`, { ...context, type: 'medication' });
  }

  apiError(message: string, error: any, context?: LogContext) {
    this.error(message, {
      ...context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      type: 'api_error',
    });
  }
}

// Exporta uma instância singleton
export const logger = new Logger();

// Exporta também a classe para casos de uso avançados
export default logger;

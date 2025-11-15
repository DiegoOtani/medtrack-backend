/**
 * Configuração Centralizada de Middlewares - MedTrack Backend
 *
 * Este arquivo documenta e centraliza a configuração de todos os middlewares
 * aplicados no backend da aplicação MedTrack.
 *
 * Ordem de Aplicação (IMPORTANTE):
 * 1. compressionMiddleware - Deve ser o primeiro para comprimir respostas
 * 2. CORS middlewares - Para permitir requisições cross-origin
 * 3. express.json() - Para parsing de JSON
 * 4. requestLogger - Para logging de requests
 * 5. cacheMiddleware - Para controle de cache
 * 6. rate limiting - Aplicado por módulo (auth, api, medication)
 * 7. authMiddleware - Para autenticação JWT
 * 8. validation middlewares - Para validação de dados
 * 9. errorLogger - Deve ser o último para capturar todos os erros
 */

export const MIDDLEWARE_CONFIG = {
  // Middlewares Globais (aplicados em app.ts)
  global: {
    compression: {
      name: 'compressionMiddleware',
      purpose: 'Adiciona headers de compressão para otimizar respostas HTTP',
      applied: true,
      location: 'app.ts',
    },
    cors: {
      name: 'CORS Configuration',
      purpose: 'Permite requisições cross-origin do frontend',
      applied: true,
      location: 'app.ts',
    },
    jsonParser: {
      name: 'express.json()',
      purpose: 'Parseia corpos de requisição JSON',
      applied: true,
      location: 'app.ts',
    },
    requestLogger: {
      name: 'requestLogger',
      purpose: 'Registra todas as requisições HTTP com métricas de performance',
      applied: true,
      location: 'app.ts',
    },
    cacheControl: {
      name: 'cacheMiddleware',
      purpose: 'Define headers apropriados de cache por tipo de requisição',
      applied: true,
      location: 'app.ts',
    },
    errorLogger: {
      name: 'errorLogger',
      purpose: 'Registra erros não tratados com contexto detalhado',
      applied: true,
      location: 'app.ts',
    },
  },

  // Middlewares por Módulo
  modules: {
    auth: {
      rateLimit: {
        name: 'authRateLimit',
        purpose: 'Limita tentativas de login/registro (5 req/15min)',
        applied: true,
        location: 'user.routes.ts',
      },
      authMiddleware: {
        name: 'authMiddleware',
        purpose: 'Valida tokens JWT em rotas protegidas',
        applied: true,
        location: 'Todas as rotas protegidas',
      },
    },
    medications: {
      rateLimit: {
        name: 'medicationRateLimit',
        purpose: 'Limita operações de medicamentos (50 req/15min)',
        applied: true,
        location: 'medication.routes.ts',
      },
      validation: {
        name: 'validateMedicationData + sanitizeMedicationData',
        purpose: 'Valida e sanitiza dados de medicamentos antes do processamento',
        applied: true,
        location: 'medication.routes.ts (POST/PUT)',
      },
    },
    history: {
      rateLimit: {
        name: 'apiRateLimit',
        purpose: 'Limita operações gerais da API (100 req/15min)',
        applied: true,
        location: 'history.routes.ts',
      },
    },
  },

  // Configurações de Rate Limiting
  rateLimits: {
    auth: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutos
      purpose: 'Protege contra brute force em autenticação',
    },
    medications: {
      maxRequests: 50,
      windowMs: 15 * 60 * 1000, // 15 minutos
      purpose: 'Limita operações frequentes de medicamentos',
    },
    api: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutos
      purpose: 'Limite geral para outras operações da API',
    },
  },

  // Regras de Segurança Implementadas
  security: {
    authentication: {
      jwtValidation: 'Todas as rotas protegidas validam JWT',
      userIsolation: 'Usuários só acessam seus próprios dados',
      tokenExpiration: 'Tokens expiram automaticamente',
    },
    rateLimiting: {
      ipBased: 'Rate limiting baseado no IP do cliente',
      endpointSpecific: 'Limites diferentes por tipo de operação',
      logging: 'Tentativas de rate limit são logadas',
    },
    validation: {
      inputSanitization: 'Dados de entrada são sanitizados',
      typeValidation: 'Validação de tipos e formatos',
      businessRules: 'Regras de negócio são aplicadas',
    },
  },

  // Sistema de Logging
  logging: {
    requestLogging: {
      allRequests: 'Todas as requisições são logadas',
      performanceMetrics: 'Duração e status code são registrados',
      userTracking: 'ID do usuário é incluído quando disponível',
    },
    errorLogging: {
      structuredErrors: 'Erros seguem formato estruturado',
      contextInfo: 'Informações de contexto são incluídas',
      securityEvents: 'Eventos de segurança são destacados',
    },
    logLevels: {
      info: 'Informações gerais do sistema',
      warn: 'Avisos e validações falhadas',
      error: 'Erros e exceções',
      debug: 'Informações detalhadas (apenas desenvolvimento)',
    },
  },
};

/**
 * Função utilitária para verificar se um middleware está aplicado
 */
export const isMiddlewareApplied = (module: string, middleware: string): boolean => {
  const moduleConfig = MIDDLEWARE_CONFIG.modules[module as keyof typeof MIDDLEWARE_CONFIG.modules];
  if (!moduleConfig) return false;

  return moduleConfig[middleware as keyof typeof moduleConfig]?.applied || false;
};

/**
 * Função para obter configuração de rate limiting por módulo
 */
export const getRateLimitConfig = (module: string) => {
  return MIDDLEWARE_CONFIG.rateLimits[module as keyof typeof MIDDLEWARE_CONFIG.rateLimits];
};

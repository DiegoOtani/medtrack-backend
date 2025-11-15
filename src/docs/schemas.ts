/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: |
 *         Autenticação via token JWT. 
 *         Para usar, inclua o token no header Authorization no formato:
 *         `Authorization: Bearer {seu-token-jwt}`
 *         
 *         O token pode ser obtido através do endpoint POST /api/users/login
 *   schemas:
 *     UserCreate:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Nome completo do usuário
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: Email único do usuário (será usado para login)
 *           example: "joao.silva@email.com"
 *         password:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Senha do usuário (será hasheada automaticamente)
 *           example: "minhaSenha123"
 *
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Nome completo do usuário (opcional)
 *           example: "João Silva Santos"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: Email do usuário (deve ser único, opcional)
 *           example: "joao.santos@email.com"
 *         password:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Nova senha do usuário (será hasheada automaticamente, opcional)
 *           example: "novaSenha456"
 *
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email cadastrado do usuário
 *           example: "joao.silva@email.com"
 *         password:
 *           type: string
 *           description: Senha do usuário
 *           example: "minhaSenha123"
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: Nome do usuário
 *           example: "João Silva"
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "joao.silva@email.com"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do usuário
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-20T14:45:00.000Z"
 *         timeZone:
 *           type: string
 *           description: Fuso horário do usuário
 *           example: "America/Sao_Paulo"
 *
 *     UserPaginatedResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de usuários encontrados
 *           example: 150
 *         page:
 *           type: integer
 *           description: Página atual
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Quantidade de itens por página
 *           example: 10
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserResponse'
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensagem de sucesso
 *           example: "Login realizado com sucesso"
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *         token:
 *           type: string
 *           description: Token JWT para autenticação
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Erro de validação"
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: Campo com erro
 *                 example: "email"
 *               message:
 *                 type: string
 *                 description: Mensagem de erro
 *                 example: "Email inválido"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Usuário não encontrado"
 *
 *     FrequencyEnum:
 *       type: string
 *       enum:
 *         - ONE_TIME
 *         - TWICE_A_DAY
 *         - THREE_TIMES_A_DAY
 *         - FOUR_TIMES_A_DAY
 *         - EVERY_OTHER_DAY
 *         - WEEKLY
 *         - MONTHLY
 *         - AS_NEEDED
 *         - CUSTOM
 *       description: Frequência de administração do medicamento
 *       example: "TWICE_A_DAY"
 *
 *     MedicationCreate:
 *       type: object
 *       required:
 *         - name
 *         - dosage
 *         - frequency
 *         - expiresAt
 *         - stock
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome do medicamento
 *           example: "Paracetamol"
 *         dosage:
 *           type: string
 *           minLength: 1
 *           description: Dosagem do medicamento
 *           example: "500mg"
 *         frequency:
 *           $ref: '#/components/schemas/FrequencyEnum'
 *         expiresAt:
 *           type: string
 *           format: date
 *           description: Data de validade do medicamento
 *           example: "2024-12-31"
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Quantidade em estoque
 *           example: 30
 *         notes:
 *           type: string
 *           description: Observações opcionais sobre o medicamento
 *           example: "Tomar com água"
 *         startTime:
 *           type: string
 *           format: time
 *           description: Horário inicial para medicamentos com frequência personalizada (formato HH:MM)
 *           example: "08:00"
 *         intervalHours:
 *           type: integer
 *           minimum: 0 
 *           description: Intervalo em horas para medicamentos com frequência CUSTOM
 *           example: 8
 *
 *     MedicationUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nome do medicamento
 *           example: "Paracetamol"
 *         dosage:
 *           type: string
 *           minLength: 1
 *           description: Dosagem do medicamento
 *           example: "500mg"
 *         frequency:
 *           $ref: '#/components/schemas/FrequencyEnum'
 *         expiresAt:
 *           type: string
 *           format: date
 *           description: Data de validade do medicamento
 *           example: "2024-12-31"
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Quantidade em estoque
 *           example: 30
 *         notes:
 *           type: string
 *           description: Observações opcionais sobre o medicamento
 *           example: "Tomar com água"
 *         startTime:
 *           type: string
 *           description: Horário inicial para medicamentos com frequência personalizada (formato HH:MM)
 *           example: "08:00"
 *         intervalHours:
 *           type: integer
 *           minimum: 0
 *           description: Intervalo em horas para medicamentos com frequência CUSTOM
 *           example: 8
 *
 *     MedicationResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do medicamento
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: Nome do medicamento
 *           example: "Paracetamol"
 *         dosage:
 *           type: string
 *           description: Dosagem do medicamento
 *           example: "500mg"
 *         frequency:
 *           $ref: '#/components/schemas/FrequencyEnum'
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Data de validade do medicamento
 *           example: "2024-12-31T00:00:00.000Z"
 *         stock:
 *           type: integer
 *           description: Quantidade em estoque
 *           example: 30
 *         notes:
 *           type: string
 *           description: Observações sobre o medicamento
 *           example: "Tomar com água"
 *         startTime:
 *           type: string
 *           description: Horário inicial para medicamentos com frequência personalizada
 *           example: "08:00"
 *         intervalHours:
 *           type: integer
 *           description: Intervalo em horas para medicamentos com frequência CUSTOM
 *           example: 8
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário proprietário do medicamento
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do registro
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-20T14:45:00.000Z"
 *
 *     MedicationPaginatedResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de medicamentos encontrados
 *           example: 25
 *         page:
 *           type: integer
 *           description: Página atual
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Quantidade de itens por página
 *           example: 10
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MedicationResponse'
 *
 *     HistoryAction:
 *       type: string
 *       enum:
 *         - TAKEN
 *         - SKIPPED
 *         - MISSED
 *         - EXPIRED
 *         - RESTOCKED
 *         - DISCARDED
 *       description: Tipo de ação registrada no histórico de medicamentos
 *       example: "TAKEN"
 *
 *     HistoryCreate:
 *       type: object
 *       required:
 *         - medicationId
 *         - action
 *       properties:
 *         medicationId:
 *           type: string
 *           format: uuid
 *           description: ID do medicamento relacionado à ação
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         scheduleId:
 *           type: string
 *           format: uuid
 *           description: ID do agendamento relacionado (opcional)
 *           example: "660e8400-e29b-41d4-a716-446655440001"
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *           description: Data/hora agendada para a medicação (opcional)
 *           example: "2024-01-15T08:00:00.000Z"
 *         action:
 *           $ref: '#/components/schemas/HistoryAction'
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantidade de comprimidos/pastilhas para ações que consomem estoque (opcional)
 *           example: 2
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Observações adicionais sobre a ação (opcional)
 *           example: "Tomado com água conforme recomendado"
 *
 *     HistoryResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do registro de histórico
 *           example: "770e8400-e29b-41d4-a716-446655440002"
 *         medicationId:
 *           type: string
 *           format: uuid
 *           description: ID do medicamento relacionado
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         scheduleId:
 *           type: string
 *           format: uuid
 *           description: ID do agendamento relacionado (se houver)
 *           example: "660e8400-e29b-41d4-a716-446655440001"
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *           description: Data/hora agendada para a medicação
 *           example: "2024-01-15T08:00:00.000Z"
 *         action:
 *           $ref: '#/components/schemas/HistoryAction'
 *         quantity:
 *           type: integer
 *           description: Quantidade consumida ou descartada
 *           example: 2
 *         notes:
 *           type: string
 *           description: Observações sobre a ação
 *           example: "Tomado com água conforme recomendado"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data/hora em que a ação foi registrada
 *           example: "2024-01-15T08:15:00.000Z"
 *         medication:
 *           type: object
 *           description: Informações básicas do medicamento
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: ID do medicamento
 *               example: "550e8400-e29b-41d4-a716-446655440000"
 *             name:
 *               type: string
 *               description: Nome do medicamento
 *               example: "Paracetamol"
 *             dosage:
 *               type: string
 *               description: Dosagem do medicamento
 *               example: "500mg"
 *
 *     HistoryPaginatedResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HistoryResponse'
 *         total:
 *           type: integer
 *           description: Total de registros encontrados
 *           example: 45
 *         page:
 *           type: integer
 *           description: Página atual
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Quantidade de itens por página
 *           example: 10
 *         totalPages:
 *           type: integer
 *           description: Total de páginas
 *           example: 5
 *
 *     AdherenceStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total de registros no período
 *           example: 30
 *         taken:
 *           type: integer
 *           description: Quantidade de vezes que o medicamento foi tomado
 *           example: 25
 *         skipped:
 *           type: integer
 *           description: Quantidade de vezes que o medicamento foi pulado intencionalmente
 *           example: 3
 *         missed:
 *           type: integer
 *           description: Quantidade de vezes que o medicamento foi esquecido/perdido
 *           example: 2
 *         adherenceRate:
 *           type: string
 *           description: Taxa de adesão em percentual (tomado / total * 100)
 *           example: "83.33"
 *
 *     ScheduleDayOfWeek:
 *       type: string
 *       enum:
 *         - MONDAY
 *         - TUESDAY
 *         - WEDNESDAY
 *         - THURSDAY
 *         - FRIDAY
 *         - SATURDAY
 *         - SUNDAY
 *       description: Dias da semana para agendamento de medicamentos
 *       example: "MONDAY"
 *
 *     ScheduleCreate:
 *       type: object
 *       required:
 *         - medicationId
 *         - time
 *         - daysOfWeek
 *       properties:
 *         medicationId:
 *           type: string
 *           format: uuid
 *           description: ID do medicamento relacionado ao agendamento
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         time:
 *           type: string
 *           pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Horário do agendamento (formato HH:MM)
 *           example: "08:00"
 *         daysOfWeek:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScheduleDayOfWeek'
 *           minItems: 1
 *           description: Dias da semana em que o medicamento deve ser tomado
 *           example: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *
 *     ScheduleUpdate:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *           pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Horário do agendamento (formato HH:MM)
 *           example: "09:00"
 *         daysOfWeek:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScheduleDayOfWeek'
 *           minItems: 1
 *           description: Dias da semana em que o medicamento deve ser tomado
 *           example: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
 *         isActive:
 *           type: boolean
 *           description: Status de ativação do agendamento
 *           example: true
 *
 *     ScheduleResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do agendamento
 *           example: "660e8400-e29b-41d4-a716-446655440001"
 *         medicationId:
 *           type: string
 *           format: uuid
 *           description: ID do medicamento relacionado
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         time:
 *           type: string
 *           description: Horário do agendamento
 *           example: "08:00"
 *         daysOfWeek:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScheduleDayOfWeek'
 *           description: Dias da semana do agendamento
 *           example: ["MONDAY", "WEDNESDAY", "FRIDAY"]
 *         isActive:
 *           type: boolean
 *           description: Status de ativação do agendamento
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do agendamento
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-20T14:45:00.000Z"
 *         medication:
 *           type: object
 *           description: Informações básicas do medicamento
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: ID do medicamento
 *               example: "550e8400-e29b-41d4-a716-446655440000"
 *             name:
 *               type: string
 *               description: Nome do medicamento
 *               example: "Paracetamol"
 *             dosage:
 *               type: string
 *               description: Dosagem do medicamento
 *               example: "500mg"
 *
 *     SchedulePaginatedResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ScheduleResponse'
 *         total:
 *           type: integer
 *           description: Total de agendamentos encontrados
 *           example: 15
 *         page:
 *           type: integer
 *           description: Página atual
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Quantidade de itens por página
 *           example: 10
 *         totalPages:
 *           type: integer
 *           description: Total de páginas
 *           example: 2
 */

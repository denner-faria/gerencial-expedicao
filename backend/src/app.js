const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignora erros de SSL do firewall corporativo (Proxy/MITM)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

// Configuração do CORS para permitir cookies (credentials)
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

// Configuração do WebSocket (Socket.io)
const io = new Server(httpServer, {
    cors: corsOptions
});

io.on('connection', (socket) => {
    // Quando o cliente se conectar, ele deve mandar seu ID para entrar na sala
    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(`usuario_${userId}`);
        }
    });
});

// Inicializa Cron de Lembretes
const { iniciarCron } = require('./cron/notificationCron');
iniciarCron(io);

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev')); // Logger de requisições

// Servir a pasta de uploads estaticamente para o front consumir as fotos da galeria
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Middleware para injetar o 'io' no 'req' para acesso nas rotas
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rotas Básicas
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const transportadoraRoutes = require('./routes/transportadoraRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const perfilRoutes = require('./routes/perfilRoutes');
const permissaoRoutes = require('./routes/permissaoRoutes');
const statusCargaRoutes = require('./routes/statusCargaRoutes');
const cadastroPecaRoutes = require('./routes/cadastroPecaRoutes');
const cadastroEmbalagemRoutes = require('./routes/cadastroEmbalagemRoutes');
const cargaRoutes = require('./routes/cargaRoutes');
const importRoutes = require('./routes/importRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const portariaRoutes = require('./routes/portariaRoutes');
const configAtrasoRoutes = require('./routes/configAtrasoRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const tvRoutes = require('./routes/tvRoutes');
const configGlobaisRoutes = require('./routes/configGlobaisRoutes');
const lembretesRoutes = require('./routes/lembretesRoutes');
const pushRoutes = require('./routes/pushRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/transportadoras', transportadoraRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/perfis', perfilRoutes);
app.use('/api/permissoes', permissaoRoutes);
app.use('/api/status-carga', statusCargaRoutes);
app.use('/api/pecas', cadastroPecaRoutes);
app.use('/api/embalagens', cadastroEmbalagemRoutes);
app.use('/api/cargas', cargaRoutes);
app.use('/api/import', importRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/portaria', portariaRoutes);
app.use('/api/config-atrasos', configAtrasoRoutes);
app.use('/api/lembretes', lembretesRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/tv', tvRoutes);
app.use('/api/config-globais', configGlobaisRoutes);
app.use('/api/push', pushRoutes);

// Rota de Health Check
app.get('/api/health', async (req, res) => {
    try {
        // Testa a conexão com o banco
        const { poolPromise } = require('./config/database');
        const pool = await poolPromise;
        await pool.request().query('SELECT 1 as result');
        
        res.json({ 
            status: 'ok', 
            database: 'connected',
            timestamp: new Date() 
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            database: 'disconnected',
            error: error.message 
        });
    }
});

// Eventos do WebSocket
io.on('connection', (socket) => {
    console.log(`🔌 Novo cliente conectado: ${socket.id}`);
    
    // Pode adicionar entrada em "salas" (rooms) se necessário no futuro
    
    socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
});

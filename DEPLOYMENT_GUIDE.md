# 🚀 GUIA DE DEPLOYMENT - API YAMAMOTO

## 📋 PRÉ-REQUISITOS

### Software Necessário
- [ ] **Node.js** v16 ou superior ([download](https://nodejs.org/))
- [ ] **MongoDB** v5.0 ou superior ([download](https://www.mongodb.com/try/download/community))
- [ ] **Git** para controle de versão (opcional)
- [ ] **Postman** para testes (opcional)

### Configurações de Conta
- [ ] Conta Gmail com **senha de app** configurada ([guia](https://support.google.com/accounts/answer/185833?hl=pt-BR))
- [ ] Cluster MongoDB (local ou Atlas) configurado

---

## ⚙️ CONFIGURAÇÃO INICIAL

### 1. Preparar o Ambiente

```powershell
# Navegar até o diretório do projeto
cd "C:\Users\pedra\OneDrive\Área de Trabalho\ApiBling"

# Verificar versão do Node
node --version  # Deve ser v16+ ou superior

# Verificar se o npm está funcionando
npm --version
```

### 2. Criar Arquivo .env

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
# ===================================
# CONFIGURAÇÕES DO SERVIDOR
# ===================================
PORT=3000
NODE_ENV=production

# ===================================
# BANCO DE DADOS MONGODB
# ===================================
# OPÇÃO 1: MongoDB Local
MONGODB_URI=mongodb://localhost:27017/yamamoto_api

# OPÇÃO 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/yamamoto_api?retryWrites=true&w=majority

# ===================================
# CONFIGURAÇÕES DE EMAIL
# ===================================
# Email que enviará os códigos de verificação
GMAIL_USER=seu-email@gmail.com

# Senha de aplicativo do Gmail (NÃO É A SENHA NORMAL)
# Como obter: https://support.google.com/accounts/answer/185833?hl=pt-BR
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# ===================================
# SEGURANÇA
# ===================================
# Chave secreta para sessões (gere uma aleatória)
SESSION_SECRET=yamamoto_secret_key_2026_production_safe

# ===================================
# CONFIGURAÇÕES OPCIONAIS
# ===================================
# Ativar logs detalhados (true/false)
DEBUG=false

# Limite de requisições por minuto (rate limiting)
RATE_LIMIT=100
```

### 3. Instalar Dependências

```powershell
# Instalar todas as dependências do projeto
npm install

# Verificar se instalou corretamente
npm list --depth=0
```

**Dependências que serão instaladas:**
- express: Framework web
- mongodb: Driver do MongoDB
- bcrypt: Hash de senhas
- yup: Validação de schemas
- chalk: Logs coloridos
- nodemailer: Envio de emails
- cors: Configurações CORS
- dotenv: Variáveis de ambiente
- express-session: Gerenciamento de sessões
- morgan: Logs HTTP

---

## 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS

### Opção A: MongoDB Local

```powershell
# Iniciar o MongoDB (Windows)
net start MongoDB

# OU se instalou manualmente:
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "C:\data\db"
```

### Opção B: MongoDB Atlas (Cloud)

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita (Free Tier - 512MB)
3. Crie um novo cluster
4. Configure o acesso: 
   - Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
   - Database Access → Add New User → Username e senha
5. Copie a **Connection String**:
   - Clusters → Connect → Connect your application
   - Copie a string: `mongodb+srv://usuario:senha@cluster...`
6. Cole no `.env` na variável `MONGODB_URI`

### Criar Collections e Indexes (Recomendado)

Conecte-se ao MongoDB e execute:

```javascript
// Usar o banco de dados
use yamamoto_api

// Criar collections com validação
db.createCollection("usuários")
db.createCollection("clientes")
db.createCollection("pedidos")
db.createCollection("servicos")
db.createCollection("servicos_checklist")
db.createCollection("servico_fotos")
db.createCollection("servico_assinatura")

// Criar indexes para performance
db.usuários.createIndex({ email: 1 }, { unique: true })
db.clientes.createIndex({ cpf: 1 }, { unique: true })
db.pedidos.createIndex({ bling_pv_id: 1 }, { unique: true })
db.pedidos.createIndex({ cliente_id: 1 })
db.servicos.createIndex({ tecnico_id: 1 })
db.servicos.createIndex({ pedido_id: 1 })
db.servicos.createIndex({ cliente_id: 1 })
db.servicos.createIndex({ status: 1 })
db.servicos.createIndex({ data_agendamento: 1 })
db.servicos_checklist.createIndex({ servico_id: 1 }, { unique: true })
db.servico_assinatura.createIndex({ servico_id: 1 }, { unique: true })
```

---

## 📧 CONFIGURAÇÃO DO GMAIL

### Obter Senha de Aplicativo

1. Acesse sua [Conta Google](https://myaccount.google.com/)
2. Vá em **Segurança**
3. Ative a **Verificação em duas etapas** (se não estiver ativa)
4. Após ativar, volte em **Segurança**
5. Procure por **Senhas de app** (aparece apenas com 2FA ativo)
6. Selecione:
   - App: **Email**
   - Dispositivo: **Outro (nome personalizado)** → Digite "API Yamamoto"
7. Clique em **Gerar**
8. Copie a senha de 16 caracteres (xxxx xxxx xxxx xxxx)
9. Cole no `.env` em `GMAIL_PASSWORD`

### Testar Envio de Email

Após configurar, teste o endpoint de cadastro:

```bash
# Cadastrar um usuário teste
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Yamamoto",
    "email": "seu-email@gmail.com",
    "Senha": "Senha123!",
    "telefone": "(11) 98765-4321",
    "typeUser": "tecnico"
  }'

# Você deve receber um email com o código de 6 dígitos
```

---

## 🎯 INICIAR O SERVIDOR

### Modo Desenvolvimento (com logs detalhados)

```powershell
# Navegar até o diretório api
cd api

# Iniciar servidor
node server/server.js
```

Você verá no console:

```
🚀 Servidor rodando na porta 3000
📡 Endpoints disponíveis em http://localhost:3000/api
✅ Conectado ao MongoDB
```

### Modo Produção (com PM2)

```powershell
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start api/server/server.js --name "yamamoto-api"

# Ver logs
pm2 logs yamamoto-api

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

---

## 🧪 TESTAR A API

### 1. Verificar Health Check

```powershell
curl http://localhost:3000/
```

Resposta esperada:
```json
{
  "message": "API Yamamoto - Sistema de Gestão de Serviços Técnicos",
  "version": "1.0.0",
  "status": "online"
}
```

### 2. Testar CRUD Completo

#### 2.1 Criar Cliente

```powershell
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "telefone": "(11) 98765-4321",
    "cpf": "123.456.789-00",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567"
  }'
```

#### 2.2 Listar Clientes

```powershell
curl http://localhost:3000/api/clientes
```

#### 2.3 Criar Pedido

```powershell
# Substitua {cliente_id} pelo ID retornado no passo 2.1
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "bling_pv_id": "PV-12345",
    "cliente_id": "{cliente_id}",
    "modelo_produto": "Ar Condicionado Split 12000 BTUs",
    "tipo_servico": "instalacao",
    "tem_instalacao": true,
    "data_agendamento": "2026-03-15T14:00:00",
    "observacoes": "Cliente prefere horário da tarde"
  }'
```

#### 2.4 Criar Técnico

```powershell
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Carlos Técnico",
    "email": "carlos@yamamoto.com",
    "Senha": "Senha123!",
    "telefone": "(11) 91234-5678",
    "typeUser": "tecnico"
  }'
```

#### 2.5 Verificar Email do Técnico

```powershell
# Substitua {codigo} pelo código recebido por email
curl -X POST http://localhost:3000/api/users/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@yamamoto.com",
    "code": "123456"
  }'
```

#### 2.6 Fazer Login

```powershell
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@yamamoto.com",
    "Senha": "Senha123!"
  }'
```

#### 2.7 Criar Serviço

```powershell
# Substitua os IDs pelos retornados nos passos anteriores
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "pedido_id": "{pedido_id}",
    "cliente_id": "{cliente_id}",
    "tecnico_id": "{tecnico_id}",
    "data_agendamento": "2026-03-15T14:00:00",
    "hora_agendamento": "14:00",
    "status": "novo",
    "observacoes": "Primeira instalação"
  }'
```

#### 2.8 Dashboard do Técnico

```powershell
# Substitua {tecnico_id}
curl http://localhost:3000/api/services/tecnico/{tecnico_id}/dashboard
```

#### 2.9 Próximas Visitas

```powershell
curl http://localhost:3000/api/services/tecnico/{tecnico_id}/proximas-visitas
```

#### 2.10 Check-in no Serviço

```powershell
# Substitua {servico_id}
curl -X PATCH http://localhost:3000/api/services/{servico_id}/checkin \
  -H "Content-Type: application/json"
```

#### 2.11 Finalizar Serviço

```powershell
curl -X POST http://localhost:3000/api/services/{servico_id}/finalizacao \
  -H "Content-Type: application/json" \
  -d '{
    "checklist": {
      "verificou_tensao": true,
      "teste_funcionamento": true,
      "fixacao_suporte": true,
      "vedacao_tubulacao": true,
      "dreno_instalado": true,
      "teste_controle_remoto": true,
      "limpeza_local": true,
      "orientacao_cliente": true
    },
    "fotos": [
      {
        "url": "https://exemplo.com/foto1.jpg",
        "legenda": "Unidade externa instalada"
      },
      {
        "url": "https://exemplo.com/foto2.jpg",
        "legenda": "Unidade interna"
      }
    ],
    "assinatura": {
      "nome_cliente": "João Silva",
      "assinatura_url": "https://exemplo.com/assinatura.png"
    }
  }'
```

---

## 📱 INTEGRAR COM APP MOBILE

### Configuração no App

No seu aplicativo React Native/Flutter/Mobile, configure a URL base:

```javascript
// config.js ou similar
const API_CONFIG = {
  // Desenvolvimento local
  BASE_URL: 'http://localhost:3000/api',
  
  // Produção (após deploy)
  // BASE_URL: 'https://api.yamamoto.com.br/api',
  
  TIMEOUT: 30000, // 30 segundos
}

export default API_CONFIG;
```

### Fluxo de Autenticação

```javascript
// 1. Login
const login = async (email, password) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, Senha: password })
  });
  
  const data = await response.json();
  
  // Salvar userId e token (se implementar JWT)
  await AsyncStorage.setItem('userId', data.data.userId);
  await AsyncStorage.setItem('userName', data.data.nome);
  
  return data;
}

// 2. Buscar Dashboard
const getDashboard = async () => {
  const userId = await AsyncStorage.getItem('userId');
  
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/services/tecnico/${userId}/dashboard`
  );
  
  return await response.json();
}

// 3. Buscar Próximas Visitas
const getProximasVisitas = async () => {
  const userId = await AsyncStorage.getItem('userId');
  
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/services/tecnico/${userId}/proximas-visitas`
  );
  
  return await response.json();
}
```

### Mapeamento de Status para Badges

```javascript
const StatusBadge = ({ status }) => {
  const configs = {
    'novo': { color: '#FF6B6B', label: 'Novo' },
    'agendado': { color: '#51CF66', label: 'Agendado' },
    'em_andamento': { color: '#FFD93D', label: 'Em Andamento' },
    'concluido': { color: '#4DABF7', label: 'Concluído' },
    'nao_realizado': { color: '#ADB5BD', label: 'Não Realizado' }
  };
  
  const config = configs[status] || configs['novo'];
  
  return (
    <Badge style={{ backgroundColor: config.color }}>
      {config.label}
    </Badge>
  );
}
```

---

## 🌐 DEPLOY EM PRODUÇÃO

### Opção 1: Heroku (Gratuito para começar)

```powershell
# Instalar Heroku CLI
# Baixe em: https://devcenter.heroku.com/articles/heroku-cli

# Fazer login
heroku login

# Criar aplicação
heroku create yamamoto-api

# Configurar MongoDB (usar addon ou Atlas)
heroku addons:create mongolab:sandbox

# OU usar MongoDB Atlas (recomendado)
heroku config:set MONGODB_URI="mongodb+srv://usuario:senha@cluster..."

# Configurar variáveis de ambiente
heroku config:set GMAIL_USER="seu-email@gmail.com"
heroku config:set GMAIL_PASSWORD="xxxx xxxx xxxx xxxx"
heroku config:set SESSION_SECRET="chave_secreta_aleatoria"

# Deploy
git push heroku main

# Verificar logs
heroku logs --tail
```

### Opção 2: VPS (DigitalOcean, AWS EC2, etc.)

```bash
# 1. Conectar ao servidor via SSH
ssh root@seu-servidor.com

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 4. Clonar repositório
git clone https://github.com/seu-usuario/yamamoto-api.git
cd yamamoto-api

# 5. Instalar dependências
npm install

# 6. Configurar .env
nano .env
# (colar as configurações)

# 7. Instalar PM2
npm install -g pm2

# 8. Iniciar aplicação
pm2 start api/server/server.js --name yamamoto-api
pm2 save
pm2 startup

# 9. Configurar Nginx (proxy reverso)
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/yamamoto-api

# Cole a configuração:
server {
    listen 80;
    server_name api.yamamoto.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/yamamoto-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Configurar SSL (Let's Encrypt)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yamamoto.com.br
```

### Opção 3: Railway (Simples e Moderno)

1. Acesse [Railway.app](https://railway.app/)
2. Faça login com GitHub
3. Clique em **New Project** → **Deploy from GitHub repo**
4. Selecione o repositório `yamamoto-api`
5. Railway detecta automaticamente o Node.js
6. Configure as variáveis de ambiente:
   - `MONGODB_URI`
   - `GMAIL_USER`
   - `GMAIL_PASSWORD`
   - `SESSION_SECRET`
7. Deploy automático!

---

## 🔒 SEGURANÇA EM PRODUÇÃO

### Checklist de Segurança

- [ ] Variáveis de ambiente configuradas (não committar `.env`)
- [ ] Senha de app do Gmail (não usar senha normal)
- [ ] MongoDB com autenticação habilitada
- [ ] HTTPS configurado (SSL/TLS)
- [ ] CORS configurado apenas para domínios permitidos
- [ ] Rate limiting implementado
- [ ] Validação de inputs em todos os endpoints
- [ ] Logs sem informações sensíveis
- [ ] Backup automático do banco de dados
- [ ] Monitoramento de erros

### Configurar CORS Restrito

```javascript
// api/server/server.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://app.yamamoto.com.br',  // Domínio do app mobile
    'https://admin.yamamoto.com.br' // Painel admin (se houver)
  ],
  credentials: true
}));
```

---

## 📊 MONITORAMENTO

### Logs com PM2

```powershell
# Ver logs em tempo real
pm2 logs yamamoto-api

# Ver logs de erro
pm2 logs yamamoto-api --err

# Ver métricas
pm2 monit
```

### Integração com Sentry (Opcional)

```javascript
// Instalar
npm install @sentry/node

// api/server/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'https://sua-chave@sentry.io/projeto',
  environment: process.env.NODE_ENV
});

// Capturar erros
app.use(Sentry.Handlers.errorHandler());
```

---

## 🆘 TROUBLESHOOTING

### Problema: Erro ao conectar no MongoDB

**Sintoma:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solução:**
```powershell
# Verificar se o MongoDB está rodando
net start MongoDB

# OU
mongod --version

# Verificar se a URI no .env está correta
echo %MONGODB_URI%
```

### Problema: Email não está sendo enviado

**Sintoma:** `Error: Invalid login: 535 Authentication failed`

**Solução:**
1. Verificar se a verificação em 2 etapas está ATIVA no Gmail
2. Gerar nova senha de aplicativo
3. Verificar se `GMAIL_USER` e `GMAIL_PASSWORD` estão corretos no `.env`
4. Testar com curl:

```powershell
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste", "email":"seu-email@gmail.com", "Senha":"Senha123!", "telefone":"(11) 99999-9999", "typeUser":"tecnico"}'
```

### Problema: Porta 3000 já está em uso

**Sintoma:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solução:**
```powershell
# Encontrar processo usando a porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F

# OU mudar a porta no .env
PORT=3001
```

### Problema: ObjectId inválido

**Sintoma:** `Argument passed in must be a string of 12 bytes or a string of 24 hex characters`

**Solução:**
- Verificar se o ID passado tem exatamente 24 caracteres hexadecimais
- Exemplo válido: `507f1f77bcf86cd799439011`
- Exemplo inválido: `123` ou `abc`

---

## 📞 SUPORTE

### Documentação Adicional

- [README.md](./README.md) - Visão geral do projeto
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Guia completo de integração
- [VALIDATION_CHECKLIST.md](./VALIDATION_CHECKLIST.md) - Checklist de validação
- [VALIDATION_SUMMARY.md](./VALIDATION_SUMMARY.md) - Resumo da validação

### Contatos

- **Desenvolvedor:** GitHub Copilot
- **Empresa:** Yamamoto
- **Email para Issues:** [criar issue no repositório]

---

## ✅ CHECKLIST FINAL

### Antes de Colocar em Produção

- [ ] `.env` configurado com credenciais corretas
- [ ] MongoDB configurado e acessível
- [ ] Gmail com senha de app funcionando
- [ ] Todos os testes passando (ver VALIDATION_CHECKLIST.md)
- [ ] Logs funcionando corretamente
- [ ] CORS configurado para produção
- [ ] SSL/HTTPS configurado
- [ ] Backup automático do banco configurado
- [ ] Monitoramento de erros configurado
- [ ] Documentação lida pela equipe de desenvolvimento
- [ ] App mobile testado com a API

### Após Deploy

- [ ] URL da API configurada no app mobile
- [ ] Teste E2E completo (cadastro → login → criar serviço → finalizar)
- [ ] Dashboard carregando corretamente
- [ ] Envio de emails funcionando
- [ ] Performance aceitável (< 1s por request)
- [ ] Logs sem erros críticos
- [ ] Backup testado e funcionando

---

## 🎉 PRONTO!

Sua API Yamamoto está configurada e pronta para uso!

**Próximos passos:**
1. Iniciar o servidor
2. Testar todos os endpoints
3. Conectar o app mobile
4. Fazer deploy em produção

**Boa sorte! 🚀**

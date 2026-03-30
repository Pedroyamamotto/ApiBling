# 🔧 YamaServerAPI - Sistema de Gestão de Serviços Técnicos Yamamoto

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**API REST completa para gerenciamento de serviços técnicos e pedidos da Yamamoto**

[🚀 Começar](#instalação) •
[📖 Documentação](#documentação) •
[🛠️ API](#endpoints) •
[🤝 Contribuir](#contribuição)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Endpoints](#endpoints)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Documentação Avançada](#documentação-avançada)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🎯 Sobre o Projeto

O **YamaServerAPI** é uma API REST robusta desenvolvida pela **Yamamoto** para gestão completa de serviços técnicos, pedidos e clientes da Yamamoto. A aplicação oferece controle total sobre o ciclo de vida dos serviços, desde a criação do pedido até a finalização com checklist, fotos e assinatura digital do cliente.

### 🎨 Características Principais

- 🔐 **Autenticação segura** com criptografia bcrypt
- 📊 **Sistema de finalização granular** com checklist técnico
- 📸 **Upload de evidências** (fotos do serviço)
- ✍️ **Assinatura digital** do cliente
- 🎯 **Rastreamento completo** de atividades
- 📧 **Notificações por e-mail** automatizadas
- 📱 **API RESTful** bem estruturada
- 🔄 **Validação de código** de verificação

## ⚡ Funcionalidades

### 👥 Gerenciamento de Usuários (Técnicos)
- [x] Cadastro e autenticação de usuários técnicos
- [x] Sistema de login/logout seguro
- [x] Recuperação e redefinição de senhas
- [x] Verificação de conta por código (6 dígitos)
- [x] Registro de atividades do usuário
- [x] Tipos de usuário customizáveis
- [x] Controle de status ativo/inativo

### 📦 Gerenciamento de Pedidos
- [x] Criação, edição e exclusão de pedidos
- [x] Vinculação com clientes (FK)
- [x] Controle de modelo de produto
- [x] Tipo de serviço customizável
- [x] Flag de instalação necessária
- [x] Agendamento de serviços
- [x] Observações e notas técnicas
- [x] Integração com Bling (bling_pv_id)
- [x] Timestamp de criação automático

### 🔧 Gerenciamento de Serviços
- [x] Criação, edição e exclusão de serviços
- [x] Vinculação com pedidos, clientes e técnicos (FKs)
- [x] Controle de status do serviço
- [x] Agendamento (data e hora)
- [x] Descrição detalhada do serviço
- [x] Campo de observações técnicas
- [x] Check-in no local
- [x] Data de conclusão automática
- [x] Registro de motivo para não realização
- [x] Timestamps de criação e atualização

### 🎯 Sistema de Finalização de Serviços
- [x] **Checklist técnico obrigatório** - 8 itens de validação
- [x] **Upload de fotos** - Evidências do serviço com envio de 1 ou 2 imagens
- [x] **Assinatura digital** - Captura de assinatura do cliente
- [x] **Validação completa** - Todos os itens obrigatórios
- [x] **Conclusão automática** - Status e timestamp atualizados
- [x] **Collections separadas** - Organização modular de dados

### 👤 Gerenciamento de Clientes
- [x] Cadastro completo de clientes
- [x] CPF único e validado
- [x] Dados de contato (telefone)
- [x] Endereço completo (rua, número, complemento, bairro, cidade, estado, CEP)
- [x] Busca e filtros avançados
- [x] Histórico de pedidos e serviços

## 📚 Documentação Avançada

### 🎯 Sistema de Finalização de Serviços

#### Como Funciona

O sistema de finalização garante que todos os serviços sejam concluídos com evidências completas: checklist técnico, fotos do trabalho realizado e assinatura do cliente confirmando a execução.

#### Atualização da Rota de Conclusão

O endpoint PATCH /api/services/:id agora aceita multipart/form-data com o campo foto repetido até 2 vezes. As imagens novas são armazenadas no MongoDB usando GridFS. O backend continua aceitando clientes antigos que enviam apenas 1 imagem e mantém o campo legado foto_url com a primeira URL salva.

Regras do upload:

- Campo: foto
- Quantidade máxima: 2 imagens
- Tipos aceitos: image/jpeg, image/jpg, image/png, image/webp, image/heic, image/heif
- Limite por arquivo: 10MB
- Erros de upload: resposta 400 para excesso de arquivos, formato inválido ou tamanho excedido

Exemplo de resposta:

```json
{
  "success": true,
  "message": "Serviço concluído",
  "foto_url": "/api/uploads/services/67d2c8b2f1a2b93f1d7a1234",
  "fotos_urls": [
    "/api/uploads/services/67d2c8b2f1a2b93f1d7a1234",
    "/api/uploads/services/67d2c8b2f1a2b93f1d7a1235"
  ]
}
```

#### Estrutura de Collections

```javascript
// Collection: servicos
{
  _id: ObjectId("..."),
  pedido_id: "abc123",
  cliente_id: "xyz789",
  tecnico_id: "tech001",
  status: "concluido",
  data_agendada: ISODate("2026-03-10"),
  hora_agendada: "14:00",
  descricao_servico: "Instalação de fechadura inteligente",
  checkin_data: ISODate("2026-03-10T14:05:00Z"),
  concluido_em: ISODate("2026-03-10T16:30:00Z"),
  created_at: ISODate("2026-03-06"),
  updated_at: ISODate("2026-03-10")
}

// Collection: servicos_checklist
{
  _id: ObjectId("..."),
  servico_id: ObjectId("..."),
  instalacao_concluida: true,
  cadastro_senhas: true,
  teste_abertura: true,
  verificacao_bateria: true,
  teste_travamento: true,
  orientacao_cliente: true,
  sincronizacao_app: true,
  entrega_cartoes: true,
  created_at: ISODate("2026-03-10")
}

// Collection: servico_fotos
{
  _id: ObjectId("..."),
  servico_id: ObjectId("..."),
  url_foto: "https://storage.exemplo.com/fotos/servico123_1.jpg",
  created_at: ISODate("2026-03-10")
}

// Collection: servico_assinatura
{
  _id: ObjectId("..."),
  servico_id: ObjectId("..."),
  nome_cliente: "Maria Silva",
  assinatura_url: "https://storage.exemplo.com/assinaturas/abc123.png",
  created_at: ISODate("2026-03-10")
}
```

#### API de Finalização

**Finalizar Serviço (POST)**
```javascript
POST /api/services/:id/finalizacao

// Body
{
  "checklist": {
    "instalacao_concluida": true,
    "cadastro_senhas": true,
    "teste_abertura": true,
    "verificacao_bateria": true,
    "teste_travamento": true,
    "orientacao_cliente": true,
    "sincronizacao_app": true,
    "entrega_cartoes": true
  },
  "fotos": [
    "https://storage.exemplo.com/fotos/foto1.jpg",
    "https://storage.exemplo.com/fotos/foto2.jpg"
  ],
  "assinatura": {
    "nome_cliente": "Maria Silva",
    "assinatura_url": "https://storage.exemplo.com/assinatura.png"
  },
  "checkin_data": "2026-03-10T14:05:00.000Z",
  "observacoes": "Cliente muito satisfeito"
}
```

**Consultar Finalização (GET)**
```javascript
GET /api/services/:id/finalizacao

// Response
{
  "message": "Finalizacao carregada com sucesso!",
  "servico": { /* dados do serviço */ },
  "checklist": { /* itens do checklist */ },
  "fotos": [ /* array de fotos */ ],
  "assinatura": { /* dados da assinatura */ }
}
```

#### Benefícios

- ✅ **Rastreabilidade total**: Todas as etapas documentadas
- ✅ **Evidências visuais**: Fotos obrigatórias do serviço
- ✅ **Confirmação do cliente**: Assinatura digital
- ✅ **Checklist padronizado**: Qualidade garantida
- ✅ **Validação automática**: Impede conclusão incompleta
- ✅ **Collections organizadas**: Fácil manutenção e consulta

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web minimalista
- **MongoDB** - Banco de dados NoSQL (driver nativo)
- **CommonJS** - Sistema de módulos

### Segurança & Validação
- **Bcrypt** - Criptografia de senhas (hash com salt)
- **Yup** - Validação de schemas e payloads
- **ObjectId** - Validação de IDs do MongoDB

### Utilitários
- **Nodemailer** - Envio de emails (Gmail SMTP)
- **Chalk** - Colorização de logs no terminal
- **Morgan** - Logging de requisições HTTP
- **Path** - Manipulação de caminhos de arquivos
- **FS** - Sistema de arquivos (templates HTML)

### DevOps
- **dotenv** - Gerenciamento de variáveis de ambiente
- **CORS** - Controle de origem cruzada

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 14+ recomendada)
- [MongoDB](https://www.mongodb.com/) (local ou Atlas)
- [Git](https://git-scm.com/)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/yamamoto/YamaServerAPI.git
cd YamaServerAPI
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas configurações:

```env
# Configurações do Banco de Dados
MONGODB_URI=mongodb://localhost:27017/yamaserverapi
MONGODB_DB=yamaserverapi_db

# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações de Sessão
SESSION_SECRET=sua-chave-secreta-super-segura

# Configurações de Email (Gmail)
GMAIL_USER=seu-email@gmail.com
GMAIL_PASS=sua-senha-de-app-gmail

# URLs
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:3000/api
```

### 📧 Configurar Gmail para envio de emails

1. Acesse [Conta Google](https://myaccount.google.com/)
2. Vá em **Segurança** > **Verificação em duas etapas**
3. Acesse **Senhas de app**
4. Gere uma senha para "Aplicativo de e-mail"
5. Use essa senha no `GMAIL_PASS`

## 🎯 Uso

### Desenvolvimento
```bash
# Executar servidor
node api/server/server.js

# Ou com nodemon (auto-reload)
npm install -g nodemon
nodemon api/server/server.js
```

### Produção
```bash
npm start
```

A API estará disponível em: `http://localhost:3000`

## 🛣️ Endpoints

### 🔐 Autenticação e Usuários
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/users` | Cadastro de usuário técnico |
| `POST` | `/api/users/login` | Login do usuário |
| `DELETE` | `/api/users/logout/:id` | Logout do usuário |
| `POST` | `/api/users/reset-password` | Solicitar redefinição de senha |
| `POST` | `/api/users/verify` | Verificar código de validação |
| `POST` | `/api/users/activity` | Registrar atividade |
| `GET` | `/api/users/activity/:userId` | Buscar atividades do usuário |

### 📦 Pedidos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/pedidos` | Criar novo pedido |
| `GET` | `/api/pedidos` | Listar pedidos (com filtros) |
| `GET` | `/api/pedidos/:id` | Buscar pedido por ID |
| `PUT` | `/api/pedidos/:id` | Atualizar pedido |
| `DELETE` | `/api/pedidos/:id` | Deletar pedido |

**Filtros disponíveis:** `?cliente_id=`, `?tipo_servico=`, `?tem_instalacao=`, `?bling_pv_id=`

### 🔧 Serviços
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/services` | Criar novo serviço |
| `GET` | `/api/services` | Listar serviços (com filtros) |
| `GET` | `/api/services/:id` | Buscar serviço por ID |
| `PUT` | `/api/services/:id` | Atualizar serviço |
| `DELETE` | `/api/services/:id` | Deletar serviço |
| `POST` | `/api/services/:id/finalizacao` | Finalizar serviço completo |
| `GET` | `/api/services/:id/finalizacao` | Consultar finalização |

**Filtros disponíveis:** `?status=`, `?tecnico_id=`, `?cliente_id=`, `?pedido_id=`

### 👤 Clientes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/clientes` | Criar novo cliente |
| `GET` | `/api/clientes` | Listar clientes (com filtros) |
| `GET` | `/api/clientes/:id` | Buscar cliente por ID |
| `PUT` | `/api/clientes/:id` | Atualizar cliente |
| `DELETE` | `/api/clientes/:id` | Deletar cliente |

**Filtros disponíveis:** `?nome=`, `?cpf=`, `?cidade=`, `?estado=`, `?telefone=`

## 📁 Estrutura do Projeto

```
YamaServerAPI/
├── 📁 api/
│   ├── 📄 db.js                    # Conexão MongoDB
│   ├── 📄 idex.js                  # Entry point
│   ├── 📁 public/                  # Arquivos estáticos
│   │   └── 📁 pages/              # Templates HTML
│   │       └── codeVrifi.html     # Email de verificação
│   ├── 📁 src/
│   │   ├── 📁 config/             # Configurações
│   │   ├── 📁 controllers/        # Lógica de negócio
│   │   │   ├── 📁 Users/          # Controllers de usuários
│   │   │   │   ├── Create.js
│   │   │   │   ├── Login.js
│   │   │   │   ├── Verify.js
│   │   │   │   └── UserActivity.js
│   │   │   ├── 📁 Pedidos/        # Controllers de pedidos
│   │   │   │   ├── CreatePedido.js
│   │   │   │   ├── GetPedidos.js
│   │   │   │   ├── GetPedidoById.js
│   │   │   │   ├── UpdatePedido.js
│   │   │   │   ├── DeletePedido.js
│   │   │   │   └── index.js
│   │   │   ├── 📁 servises/       # Controllers de serviços
│   │   │   │   ├── CreatServices.js
│   │   │   │   ├── GetServices.js
│   │   │   │   ├── GetServiceById.js
│   │   │   │   ├── UpdateService.js
│   │   │   │   ├── DeleteService.js
│   │   │   │   ├── FinalizeService.js
│   │   │   │   ├── GetServiceFinalizacao.js
│   │   │   │   └── index.js
│   │   │   └── 📁 clientes/       # Controllers de clientes
│   │   │       ├── CreateCliente.js
│   │   │       ├── GetClientes.js
│   │   │       ├── GetClienteById.js
│   │   │       ├── UpdateCliente.js
│   │   │       ├── DeleteCliente.js
│   │   │       └── index.js
│   │   ├── 📁 middlewares/        # Middlewares customizados
│   │   ├── 📁 models/             # Utilitários de modelo
│   │   │   ├── userActivityModel.js
│   │   │   └── sessionModel.js
│   │   ├── 📁 routes/             # Definição das rotas
│   │   │   ├── index.js           # Agregador de rotas
│   │   │   ├── users.js
│   │   │   ├── pedidos.js
│   │   │   ├── services.js
│   │   │   ├── clientes.js
│   │   │   └── EmailRoutes.js
│   │   └── 📁 server/             # Configuração do servidor
│   │       ├── server.js          # Servidor principal
│   │       └── apiRedirect.js     # Redirecionamentos
│   └── 📁 utils/                  # Utilitários gerais
│       └── emailServices.js       # Serviço de email
├── 📄 package.json                # Dependências
├── 📄 .env                        # Variáveis de ambiente
└── 📄 Readme.md                   # Este arquivo
```

## 📖 Documentação de Uso

### Exemplo 1: Criar Cliente

```javascript
POST /api/clientes

// Request Body
{
  "nome": "João da Silva",
  "telefone": "(11) 98765-4321",
  "cpf": "123.456.789-00",
  "numero": "123",
  "complemento": "Apto 45",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567"
}

// Response (201 Created)
{
  "message": "Cliente criado com sucesso!",
  "clienteId": "65a1b2c3d4e5f6789012345"
}
```

### Exemplo 2: Criar Pedido

```javascript
POST /api/pedidos

// Request Body
{
  "bling_pv_id": "PV-2026-001",
  "cliente_id": "65a1b2c3d4e5f6789012345",
  "modelo_produto": "Fechadura Inteligente X1000",
  "tipo_servico": "Instalação",
  "tem_instalacao": true,
  "data_agendamento": "2026-03-15T14:00:00.000Z",
  "observacoes": "Cliente preferiu instalação na parte da tarde"
}

// Response (201 Created)
{
  "message": "Pedido criado com sucesso!",
  "pedidoId": "65a2b3c4d5e6f7890123456"
}
```

### Exemplo 3: Criar Serviço

```javascript
POST /api/services

// Request Body
{
  "pedido_id": "65a2b3c4d5e6f7890123456",
  "cliente_id": "65a1b2c3d4e5f6789012345",
  "tecnico_id": "65a3b4c5d6e7f8901234567",
  "status": "agendado",
  "data_agendada": "2026-03-15",
  "hora_agendada": "14:00",
  "descricao_servico": "Instalação de fechadura inteligente X1000 na porta principal",
  "observacoes": "Levar kit completo de instalação"
}

// Response (201 Created)
{
  "message": "Servico criado com sucesso!",
  "serviceId": "65a4b5c6d7e8f9012345678"
}
```

### Exemplo 4: Finalizar Serviço

```javascript
POST /api/services/65a4b5c6d7e8f9012345678/finalizacao

// Request Body
{
  "checklist": {
    "instalacao_concluida": true,
    "cadastro_senhas": true,
    "teste_abertura": true,
    "verificacao_bateria": true,
    "teste_travamento": true,
    "orientacao_cliente": true,
    "sincronizacao_app": true,
    "entrega_cartoes": true
  },
  "fotos": [
    "https://cdn.exemplo.com/servicos/foto1.jpg",
    "https://cdn.exemplo.com/servicos/foto2.jpg",
    "https://cdn.exemplo.com/servicos/foto3.jpg"
  ],
  "assinatura": {
    "nome_cliente": "João da Silva",
    "assinatura_url": "https://cdn.exemplo.com/assinaturas/abc123.png"
  },
  "checkin_data": "2026-03-15T14:10:00.000Z",
  "observacoes": "Instalação concluída sem intercorrências. Cliente muito satisfeito."
}

// Response (200 OK)
{
  "message": "Servico finalizado com sucesso!",
  "serviceId": "65a4b5c6d7e8f9012345678"
}
```

## 🧪 Testes

```bash
# Para implementar testes futuramente, considere:
npm install --save-dev jest supertest mongodb-memory-server

# Executar testes
npm test
```

## 🚀 Deploy

### MongoDB Atlas (Recomendado)

1. Crie uma conta em [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie um cluster gratuito
3. Configure o IP whitelist (0.0.0.0/0 para acesso público)
4. Obtenha a string de conexão
5. Atualize `MONGODB_URI` no `.env`

### Render / Railway / Heroku

```bash
# 1. Conecte seu repositório Git ao serviço escolhido

# 2. Configure as variáveis de ambiente:
MONGODB_URI=sua-uri-mongodb-atlas
MONGODB_DB=apibling_db
ADMIN_API_KEY=sua-chave-admin
RESEND_API_KEY=sua-chave-resend
NODE_ENV=production

# 3. Configure os comandos:
# Build Command: npm install
# Start Command: npm start
```

Observações de produção:

- As fotos novas de conclusão são armazenadas no MongoDB via GridFS.
- As URLs retornadas pela API para essas fotos seguem o formato /api/uploads/services/:fileId.
- Para rotas administrativas em produção, configure ADMIN_API_KEY; o fallback x-user-type=admin deve ficar restrito a teste.

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Para contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -m 'feat: Adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. Abra um **Pull Request**

### 📝 Padrões de Commit (Conventional Commits)
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Alterações na documentação
- `style:` Formatação, sem mudanças de código
- `refactor:` Refatoração de código
- `test:` Adição ou correção de testes
- `chore:` Tarefas de manutenção

## 🐛 Reportar Bugs

Encontrou um bug? Abra uma [issue](https://github.com/yamamoto/YamaServerAPI/issues) com:

- ✅ Descrição clara do problema
- ✅ Passos para reproduzir
- ✅ Comportamento esperado vs atual
- ✅ Logs de erro (se aplicável)
- ✅ Informações do ambiente (SO, Node version, etc)

## 📞 Suporte

- 📧 Email: suporte@yamamoto.com.br
- 🐛 Issues: [GitHub Issues](https://github.com/yamamoto/YamaServerAPI/issues)

## 🗺️ Roadmap

- [x] Implementar upload real de arquivos (Multer)
- [ ] Adicionar autenticação JWT
- [x] Criar dashboard de métricas
- [ ] Implementar notificações push
- [ ] Adicionar relatórios em PDF
- [x] Criar sistema de permissões por role
- [ ] Implementar busca geoespacial (técnico mais próximo)
- [ ] Adicionar testes automatizados (Jest)

## 📄 Licença

Este projeto está licenciado sob a **Licença ISC**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela!**

Desenvolvido com ❤️ pela **Yamamoto**

</div>

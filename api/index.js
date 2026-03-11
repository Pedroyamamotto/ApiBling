import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import apiRedirect from "./src/routes/index.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "node:path";


const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve("./api/public/uploads")));

// Busca as Rotas
app.use("/api", apiRedirect);

// Swagger Documentation
const options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "ApiBling API",
            version: "1.0.0",
            description: "Documentação da API ApiBling - Sistema de gestão de serviços",
            contact: {
                name: "Pedro Yamamoto",
                url: "https://github.com/Pedroyamamotto",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
    },
    apis: ["./src/routes/*.js"],
};

// Teste simples - adicionar manualmente alguns endpoints
const specs = swaggerJsdoc(options);

// Adicionar endpoints manualmente para documentação completa
specs.paths = {
    "/api/users": {
        "post": {
            "summary": "Criar novo usuário",
            "tags": ["Usuários"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["nome", "email", "password", "telefone", "typeUser"],
                            "properties": {
                                "nome": {"type": "string", "description": "Nome completo do usuário"},
                                "email": {"type": "string", "format": "email", "description": "Email do usuário"},
                                "password": {"type": "string", "description": "Senha do usuário"},
                                "telefone": {"type": "string", "description": "Telefone do usuário"},
                                "typeUser": {"type": "string", "enum": ["tecnico", "admin"], "description": "Tipo de usuário"}
                            }
                        }
                    }
                }
            },
            "responses": {
                "201": {"description": "Usuário criado com sucesso"},
                "400": {"description": "Dados inválidos"},
                "500": {"description": "Erro interno do servidor"}
            }
        }
    },
    "/api/users/login": {
        "post": {
            "summary": "Fazer login",
            "tags": ["Usuários"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["email", "password"],
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "password": {"type": "string"}
                            }
                        }
                    }
                }
            },
            "responses": {
                "200": {"description": "Login realizado com sucesso"},
                "401": {"description": "Credenciais inválidas"},
                "403": {"description": "Conta não verificada"}
            }
        }
    },
    "/api/users/verify": {
        "post": {
            "summary": "Verificar conta de usuário",
            "tags": ["Usuários"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["email", "code"],
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "code": {"type": "string", "description": "Código de 6 dígitos"}
                            }
                        }
                    }
                }
            },
            "responses": {
                "200": {"description": "Conta verificada com sucesso"},
                "400": {"description": "Código inválido"},
                "404": {"description": "Usuário não encontrado"}
            }
        }
    },
    "/api/users/request-password-reset": {
        "post": {
            "summary": "Solicitar reset de senha",
            "tags": ["Usuários"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["email"],
                            "properties": {
                                "email": {"type": "string", "format": "email"}
                            }
                        }
                    }
                }
            },
            "responses": {
                "200": {"description": "Código enviado por email"},
                "404": {"description": "Usuário não encontrado"}
            }
        }
    },
    "/api/users/reset-password": {
        "post": {
            "summary": "Confirmar reset de senha",
            "tags": ["Usuários"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["email", "code", "newPassword"],
                            "properties": {
                                "email": {"type": "string", "format": "email"},
                                "code": {"type": "string", "description": "Código de reset"},
                                "newPassword": {"type": "string", "description": "Nova senha"}
                            }
                        }
                    }
                }
            },
            "responses": {
                "200": {"description": "Senha alterada com sucesso"},
                "400": {"description": "Código inválido"}
            }
        }
    },
    "/api/clientes": {
        "get": {
            "summary": "Listar clientes",
            "tags": ["Clientes"],
            "parameters": [
                {"name": "page", "in": "query", "schema": {"type": "integer"}, "description": "Página"},
                {"name": "limit", "in": "query", "schema": {"type": "integer"}, "description": "Limite por página"},
                {"name": "search", "in": "query", "schema": {"type": "string"}, "description": "Termo de busca"}
            ],
            "responses": {
                "200": {"description": "Lista de clientes"}
            }
        },
        "post": {
            "summary": "Criar cliente",
            "tags": ["Clientes"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["cliente", "telefone", "cpf", "endereco"],
                            "properties": {
                                "cliente": {"type": "string", "description": "Nome do cliente"},
                                "cpf": {"type": "string", "description": "CPF do cliente"},
                                "telefone": {"type": "string"},
                                "celular": {"type": "string"},
                                "email": {"type": "string", "format": "email", "nullable": true},
                                "bling_pedido_id": {"type": "string", "nullable": true, "description": "ID do pedido no Bling"},
                                "endereco": {
                                    "type": "object",
                                    "required": ["rua", "numero", "bairro", "cidade", "estado", "cep"],
                                    "properties": {
                                        "rua": {"type": "string"},
                                        "numero": {"type": "string"},
                                        "bairro": {"type": "string"},
                                        "cidade": {"type": "string"},
                                        "estado": {"type": "string"},
                                        "cep": {"type": "string"},
                                        "complemento": {"type": "string"}
                                    }
                                }
                            },
                            "example": {
                                "cliente": "Rodrigo Luperi",
                                "cpf": "26917488801",
                                "telefone": "(11) 94167-0180",
                                "celular": "(11) 94167-0180",
                                "email": "",
                                "bling_pedido_id": "",
                                "endereco": {
                                    "rua": "Rua Professor Jose Kliass",
                                    "numero": "49",
                                    "bairro": "Rio Pequeno",
                                    "cidade": "Sao Paulo",
                                    "estado": "SP",
                                    "cep": "05379080",
                                    "complemento": "ap 133"
                                }
                            }
                        }
                    }
                }
            },
            "responses": {
                "201": {"description": "Cliente criado"}
            }
        }
    },
    "/api/clientes/{id}": {
        "get": {
            "summary": "Obter cliente por ID",
            "tags": ["Clientes"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Dados do cliente"},
                "404": {"description": "Cliente não encontrado"}
            }
        },
        "put": {
            "summary": "Atualizar cliente",
            "tags": ["Clientes"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/Cliente"}
                    }
                }
            },
            "responses": {
                "200": {"description": "Cliente atualizado"},
                "404": {"description": "Cliente não encontrado"}
            }
        },
        "delete": {
            "summary": "Deletar cliente",
            "tags": ["Clientes"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Cliente deletado"},
                "404": {"description": "Cliente não encontrado"}
            }
        }
    },
    "/api/pedidos": {
        "get": {
            "summary": "Listar pedidos",
            "tags": ["Pedidos"],
            "parameters": [
                {"name": "page", "in": "query", "schema": {"type": "integer"}},
                {"name": "limit", "in": "query", "schema": {"type": "integer"}},
                {"name": "status", "in": "query", "schema": {"type": "string", "enum": ["pendente", "em_andamento", "concluido", "cancelado"]}},
                {"name": "clienteId", "in": "query", "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Lista de pedidos"}
            }
        },
        "post": {
            "summary": "Criar pedido",
            "tags": ["Pedidos"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["clienteId", "descricao", "valor", "status"],
                            "properties": {
                                "clienteId": {"type": "string"},
                                "descricao": {"type": "string"},
                                "valor": {"type": "number"},
                                "status": {"type": "string", "enum": ["pendente", "em_andamento", "concluido", "cancelado"]},
                                "dataEntrega": {"type": "string", "format": "date"},
                                "observacoes": {"type": "string"}
                            }
                        }
                    }
                }
            },
            "responses": {
                "201": {"description": "Pedido criado"}
            }
        }
    },
    "/api/pedidos/{id}": {
        "get": {
            "summary": "Obter pedido por ID",
            "tags": ["Pedidos"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Dados do pedido"},
                "404": {"description": "Pedido não encontrado"}
            }
        },
        "put": {
            "summary": "Atualizar pedido",
            "tags": ["Pedidos"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/Pedido"}
                    }
                }
            },
            "responses": {
                "200": {"description": "Pedido atualizado"},
                "404": {"description": "Pedido não encontrado"}
            }
        },
        "delete": {
            "summary": "Deletar pedido",
            "tags": ["Pedidos"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Pedido deletado"},
                "404": {"description": "Pedido não encontrado"}
            }
        }
    },
    "/api/services": {
        "get": {
            "summary": "Listar serviços",
            "tags": ["Serviços"],
            "parameters": [
                {"name": "page", "in": "query", "schema": {"type": "integer"}},
                {"name": "limit", "in": "query", "schema": {"type": "integer"}},
                {"name": "status", "in": "query", "schema": {"type": "string", "enum": ["agendado", "em_andamento", "concluido", "cancelado", "nao_realizado"]}},
                {"name": "tecnicoId", "in": "query", "schema": {"type": "string"}},
                {"name": "clienteId", "in": "query", "schema": {"type": "string"}},
                {"name": "dataInicio", "in": "query", "schema": {"type": "string", "format": "date"}},
                {"name": "dataFim", "in": "query", "schema": {"type": "string", "format": "date"}}
            ],
            "responses": {
                "200": {"description": "Lista de serviços"}
            }
        },
        "post": {
            "summary": "Criar serviço",
            "tags": ["Serviços"],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "required": ["clienteId", "tecnicoId", "pedidoId", "descricao", "dataAgendada", "status"],
                            "properties": {
                                "clienteId": {"type": "string"},
                                "tecnicoId": {"type": "string"},
                                "pedidoId": {"type": "string"},
                                "descricao": {"type": "string"},
                                "dataAgendada": {"type": "string", "format": "date"},
                                "status": {"type": "string", "enum": ["agendado", "em_andamento", "concluido", "cancelado", "nao_realizado"]},
                                "observacoes": {"type": "string"},
                                "horaInicio": {"type": "string"},
                                "horaFim": {"type": "string"}
                            }
                        }
                    }
                }
            },
            "responses": {
                "201": {"description": "Serviço criado"}
            }
        }
    },
    "/api/services/{id}": {
        "get": {
            "summary": "Obter serviço por ID",
            "tags": ["Serviços"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Dados do serviço"},
                "404": {"description": "Serviço não encontrado"}
            }
        },
        "put": {
            "summary": "Atualizar serviço",
            "tags": ["Serviços"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "requestBody": {
                "required": true,
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/Service"}
                    }
                }
            },
            "responses": {
                "200": {"description": "Serviço atualizado"},
                "404": {"description": "Serviço não encontrado"}
            }
        },
        "delete": {
            "summary": "Deletar serviço",
            "tags": ["Serviços"],
            "parameters": [
                {"name": "id", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Serviço deletado"},
                "404": {"description": "Serviço não encontrado"}
            }
        }
    },
    "/api/services/tecnico/{tecnicoId}/dashboard": {
        "get": {
            "summary": "Dashboard do técnico",
            "tags": ["Serviços"],
            "parameters": [
                {"name": "tecnicoId", "in": "path", "required": true, "schema": {"type": "string"}}
            ],
            "responses": {
                "200": {"description": "Estatísticas do dashboard"}
            }
        }
    },
    "/api/services/tecnico/{tecnicoId}/dia/{data}": {
        "get": {
            "summary": "Serviços do técnico em uma data",
            "tags": ["Serviços"],
            "parameters": [
                {"name": "tecnicoId", "in": "path", "required": true, "schema": {"type": "string"}},
                {"name": "data", "in": "path", "required": true, "schema": {"type": "string", "format": "date"}, "description": "Formato: DD-MM-YYYY"}
            ],
            "responses": {
                "200": {"description": "Serviços do dia"}
            }
        }
    }
};

specs.tags = [
    {"name": "Usuários", "description": "Operações relacionadas aos usuários"},
    {"name": "Clientes", "description": "Operações relacionadas aos clientes"},
    {"name": "Pedidos", "description": "Operações relacionadas aos pedidos"},
    {"name": "Serviços", "description": "Operações relacionadas aos serviços"}
];
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

// Expor JSON da documentação
app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
});

// Servir páginas estáticas
app.use("/pages", express.static(path.resolve("./public/pages")));

// erro 404 handeler
app.use((req, res) => {
    return res.status(404).json({
        status: "error",
        message: "Rota não encontrada"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});

export default app;
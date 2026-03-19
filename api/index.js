import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import apiRedirect from "./src/routes/index.js";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "node:path";
import { fileURLToPath } from "node:url";
// import removido: getServiceAllPhotos não é usado diretamente aqui e o caminho estava errado

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.resolve("./api/public/uploads")));


  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use("/api", apiRedirect);
  app.use("/api/v1", apiRedirect);

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
          url: "https://api.yama.ia.br",
        },
        {
          url: "http://localhost:3000",
        },
      ],
      components: {
        securitySchemes: {
          AdminKey: {
            type: "apiKey",
            in: "header",
            name: "x-admin-key",
            description: "Chave de admin. Em desenvolvimento, pode usar o header x-user-type: admin.",
          },
        },
      },
      tags: [
        { name: "Usuários", description: "Operações relacionadas aos usuários" },
        { name: "Clientes", description: "Operações relacionadas aos clientes" },
        { name: "Pedidos", description: "Operações relacionadas aos pedidos" },
        { name: "Serviços", description: "Operações relacionadas aos serviços" },
        { name: "Admin", description: "Rotas administrativas protegidas" },
      ],
    },
    apis: ["./api/src/routes/*.js"],
  };

  const specs = swaggerJsdoc(options);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(specs);
  });

  app.use("/pages", express.static(path.resolve("./public/pages")));

  app.use((req, res) => {
    return res.status(404).json({
      status: "error",
      message: "Rota não encontrada",
    });
  });

  return app;
};

const app = createApp();

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
  });

  // Handlers para capturar erros não tratados
  process.on("uncaughtException", (err) => {
    console.error("❌ Erro não capturado:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Promise rejeitada não tratada:", reason);
    process.exit(1);
  });

  server.on("error", (err) => {
    console.error("❌ Erro do servidor:", err);
    process.exit(1);
  });
}

export default app;
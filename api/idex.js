import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import apiRedirect from "./src/routes/index.js";


const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Busca as Rotas
app.use("/api", apiRedirect);

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
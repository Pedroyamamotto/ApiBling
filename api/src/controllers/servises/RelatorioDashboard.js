import { getDb } from "../../db.js";

export const relatorioDashboard = async (req, res) => {
    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        const usuariosCollection = db.collection("usuários");

        // Contagens por status
        const [statusCounts, tecnicosAtivos] = await Promise.all([
            servicosCollection
                .aggregate([
                    {
                        $group: {
                            _id: "$status",
                            count: { $sum: 1 },
                        },
                    },
                ])
                .toArray(),
            servicosCollection.distinct("tecnico_id", {
                status: { $in: ["aguardando", "atribuido"] },
                tecnico_id: { $exists: true, $ne: null },
            }),
        ]);

        const countMap = {};
        for (const item of statusCounts) {
            if (item._id) countMap[item._id] = item.count;
        }

        // Padronização dos status
        const aguardando = countMap["aguardando"] || 0;
        const atribuidos = countMap["atribuido"] || 0;
        const concluidos = countMap["concluido"] || 0;
        const naoRealizados = countMap["nao_realizado"] || 0;
        const total = aguardando + atribuidos + concluidos + naoRealizados;
        const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

        // Técnicos
        const tecnicos = await usuariosCollection.countDocuments({ typeUser: "tecnico" });
        // Serviços concluídos por técnico
        const servicosPorTecnico = await servicosCollection.aggregate([
            { $match: { status: "concluido", tecnico_id: { $exists: true, $ne: null } } },
            { $group: { _id: "$tecnico_id", concluidos: { $sum: 1 } } },
        ]).toArray();

        return res.status(200).json({
            aguardando,
            atribuidos,
            concluidos,
            total,
            taxaConclusao,
            tecnicosAtivos: tecnicosAtivos.length,
            naoRealizados,
            pedidosTotais: total,
            tecnicos,
            servicosConcluidosPorTecnico: servicosPorTecnico,
        });
    } catch {
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};

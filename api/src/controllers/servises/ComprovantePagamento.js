import { ObjectId } from "mongodb";
import { getDb } from "../../db.js";
import { saveServicePhotos } from "../../services/servicePhotoStorage.js";

// Upload de comprovante de pagamento (imagem)
export const uploadComprovantePagamento = async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID do serviço inválido" });
    }
    if (!Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "Envie ao menos 1 imagem no campo comprovante" });
    }
    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        const service = await servicosCollection.findOne({ _id: new ObjectId(id) });
        if (!service) {
            return res.status(404).json({ message: "Serviço não encontrado" });
        }
        // Salva imagem no GridFS
        const uploaded = await saveServicePhotos(req.files, id);
        // Salva referência no serviço
        await servicosCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { comprovante_pagamento: uploaded[0] } }
        );
        return res.status(200).json({ success: true, comprovante: uploaded[0] });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao salvar comprovante", detail: error.message });
    }
};

// Exibir comprovante de pagamento
export const getComprovantePagamento = async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID do serviço inválido" });
    }
    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        const service = await servicosCollection.findOne({ _id: new ObjectId(id) });
        if (!service || !service.comprovante_pagamento) {
            return res.status(404).json({ message: "Comprovante não encontrado" });
        }
        return res.status(200).json({ comprovante: service.comprovante_pagamento });
    } catch (error) {
        return res.status(500).json({ message: "Erro ao buscar comprovante", detail: error.message });
    }
};

import chalk from "chalk";
import { ObjectId } from "mongodb";
import { getDb } from "../../db.js";

export const getServicesAdminLista = async (req, res) => {
    try {
        const db = await getDb();
        const servicosCollection = db.collection("servicos");
        const clientesCollection = db.collection("clientes");
        const usuariosCollection = db.collection("usuários");

        const {
            status,
            tecnico_id,
            cliente_id,
            pedido_id,
            numero_pedido,
            page = 1,
            limit = 20,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const filter = {};
        if (status) filter.status = status;
        if (tecnico_id) filter.tecnico_id = tecnico_id;
        if (cliente_id) filter.cliente_id = cliente_id;
        if (pedido_id) filter.pedido_id = pedido_id;
        if (numero_pedido) filter.numero_pedido = numero_pedido;

        const [services, total] = await Promise.all([
            servicosCollection
                .find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitNum)
                .toArray(),
            servicosCollection.countDocuments(filter),
        ]);

        if (services.length === 0) {
            return res.status(200).json({
                message: "Serviços listados com sucesso!",
                page: pageNum,
                limit: limitNum,
                total: 0,
                totalPages: 0,
                count: 0,
                services: [],
            });
        }

        // Coleta IDs únicos de clientes e técnicos para busca em lote
        const clienteIds = [...new Set(services.map((s) => s.cliente_id).filter(Boolean))];
        const tecnicoIds = [...new Set(services.map((s) => s.tecnico_id).filter(Boolean))];

        // Tenta converter para ObjectId quando possível
        const toObjectIdFilter = (ids) => {
            const objectIds = [];
            const strings = [];
            for (const id of ids) {
                try {
                    objectIds.push(new ObjectId(String(id)));
                } catch {
                    strings.push(id);
                }
            }
            return objectIds.length > 0
                ? { $in: [...objectIds, ...strings] }
                : { $in: strings };
        };

        const [clientes, tecnicos] = await Promise.all([
            clienteIds.length > 0
                ? clientesCollection
                      .find(
                          { _id: toObjectIdFilter(clienteIds) },
                          {
                              projection: {
                                  _id: 1,
                                  nome: 1,
                                  telefone: 1,
                                  celular: 1,
                                  rua: 1,
                                  numero: 1,
                                  complemento: 1,
                                  bairro: 1,
                                  cidade: 1,
                                  estado: 1,
                              },
                          }
                      )
                      .toArray()
                : Promise.resolve([]),

            tecnicoIds.length > 0
                ? usuariosCollection
                      .find(
                          { _id: toObjectIdFilter(tecnicoIds) },
                          { projection: { _id: 1, nome: 1, telefone: 1, email: 1 } }
                      )
                      .toArray()
                : Promise.resolve([]),
        ]);

        // Mapas para lookup O(1)
        const clienteMap = new Map(clientes.map((c) => [c._id.toString(), c]));
        const tecnicoMap = new Map(tecnicos.map((t) => [t._id.toString(), t]));

        const servicesFormatted = services.map((service) => {
            const serviceId = service._id.toString();

            const cliente = clienteMap.get(String(service.cliente_id)) || null;
            const tecnico = tecnicoMap.get(String(service.tecnico_id)) || null;
            const fotosUrls = Array.isArray(service.fotos_urls) && service.fotos_urls.length > 0
                ? service.fotos_urls.filter(Boolean)
                : service.foto_url
                    ? [service.foto_url]
                    : [];
            const fotosContexto = service.fotos_contexto && typeof service.fotos_contexto === "object"
                ? service.fotos_contexto
                : {};
            const fotosPortaCliente = Array.isArray(fotosContexto.porta_cliente)
                ? fotosContexto.porta_cliente.filter(Boolean)
                : [];
            const fotosInstalacoes = Array.isArray(fotosContexto.instalacoes)
                ? fotosContexto.instalacoes.filter(Boolean)
                : [];

            const enderecoCliente = cliente
                                ? [
                                            cliente.rua,
                                            cliente.numero,
                                            cliente.complemento,
                                            cliente.bairro,
                                            cliente.cidade,
                                            cliente.estado,
                                    ]
                                            .filter(Boolean)
                                            .join(", ")
                                : null;

            return {
                ordem_de_servico: service.ordem_de_servico ?? null,
                id: serviceId,
                numero_pedido: service.numero_pedido ?? null,
                pedido_id: service.pedido_id ?? null,
                status: service.status,
                data_agendada: service.data_agendada ?? null,
                hora_agendada: service.hora_agendada ?? null,
                descricao_servico: service.descricao_servico ?? null,
                observacoes: service.observacoes ?? null,
                created_at: service.created_at ?? null,
                updated_at: service.updated_at ?? null,

                // Cliente enriched
                cliente_id: service.cliente_id ?? null,
                nome_cliente: cliente?.nome ?? null,
                telefone_cliente: cliente?.celular || cliente?.telefone || null,
                endereco_cliente: enderecoCliente,

                // Técnico enriched
                tecnico_id: service.tecnico_id ?? null,
                nome_tecnico: tecnico?.nome ?? null,
                telefone_tecnico: tecnico?.telefone ?? null,

                // Finalização
                checkin_data: service.checkin_data ?? null,
                concluido_em: service.concluido_em ?? null,
                checklist: Array.isArray(service.checklist) ? service.checklist : [],
                foto_url: service.foto_url ?? fotosUrls[0] ?? null,
                fotos_urls: fotosUrls,
                fotos_contexto: {
                    porta_cliente: fotosPortaCliente,
                    instalacoes: fotosInstalacoes,
                },
                fotos_porta_cliente_urls: fotosPortaCliente.map((item) => item?.url).filter(Boolean),
                fotos_instalacoes_urls: fotosInstalacoes.map((item) => item?.url).filter(Boolean),
                assinatura_url: service.assinatura_url ?? null,
                motivo_nao_realizacao:
                    service.motivo_nao_realizacao || service.nao_realizado_motivo || null,
                ordem_de_servico: service.ordem_de_servico ?? null,
            };
        });

        console.log(
            chalk.blue(
                `Sistema 💻 : Admin lista ${servicesFormatted.length}/${total} serviço(s) com dados de cliente/técnico 🔍`
            )
        );

        return res.status(200).json({
            message: "Serviços listados com sucesso!",
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            count: servicesFormatted.length,
            services: servicesFormatted,
        });
    } catch (error) {
        console.error("Erro ao buscar serviços admin lista:", error);
        return res.status(500).json({ message: "Erro interno no servidor" });
    }
};

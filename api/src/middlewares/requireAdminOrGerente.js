export const requireAdminOrGerente = (req, res, next) => {
    const adminApiKey = process.env.ADMIN_API_KEY;
    const providedApiKey = req.headers["x-admin-key"];
    const userType = String(req.headers["x-user-type"] || "").toLowerCase();
    const allowHeaderRoleAuth = String(process.env.ALLOW_HEADER_ROLE_AUTH || "").toLowerCase() === "true";

    // Em produção com chave configurada, a chave de admin sempre libera acesso.
    if (adminApiKey && providedApiKey === adminApiKey) {
        return next();
    }

    if (adminApiKey && !allowHeaderRoleAuth) {
        return res.status(403).json({
            message: "Acesso negado: chave de admin obrigatoria",
        });
    }

    // Fallback para ambientes sem autenticação formal por token/JWT.
    if (userType === "admin" || userType === "gerente") {
        return next();
    }

    return res.status(403).json({
        message: "Acesso negado: somente admin ou gerente",
    });
};

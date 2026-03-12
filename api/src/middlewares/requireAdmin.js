export const requireAdmin = (req, res, next) => {
    const adminApiKey = process.env.ADMIN_API_KEY;
    const providedApiKey = req.headers["x-admin-key"];
    const userType = req.headers["x-user-type"];

    if (adminApiKey) {
        if (providedApiKey !== adminApiKey) {
            return res.status(403).json({ message: "Acesso negado: somente administrador" });
        }

        return next();
    }

    // Fallback para ambiente sem ADMIN_API_KEY configurada
    if (userType === "admin") {
        return next();
    }

    return res.status(403).json({
        message: "Acesso negado: configure ADMIN_API_KEY ou envie x-user-type=admin em ambiente de teste",
    });
};

/**
 * requireAuth — vérifie qu'une session valide existe.
 * Si non authentifié → redirect /auth/login
 */
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect("/auth/login");
    }
    next();
};

/**
 * requireRole(...roles) — vérifie que l'utilisateur connecté
 * possède l'un des rôles autorisés.
 * L'autorisation est vérifiée côté serveur, pas seulement dans les vues.
 *
 * Usage :
 *   router.get("/admin", requireAuth, requireRole("ADMIN"), controller)
 *   router.get("/shared", requireAuth, requireRole("ADMIN","CHARGE_CLIENT"), controller)
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        const user = req.session.user;

        if (!user) {
            return res.redirect("/auth/login");
        }

        if (!roles.includes(user.role)) {
            return res.status(403).render("errors/403", { user });
        }

        next();
    };
};

module.exports = { requireAuth, requireRole };

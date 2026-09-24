const userRepository = require("../repositories/user.repository");

async function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/auth/login");
    }
    
    try {
        const user = await userRepository.findById(req.session.userId);
        if (!user || !user.actif) {
            req.session.destroy();
            return res.redirect("/auth/login");
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).send("Erreur de serveur interne.");
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).send("Accès interdit.");
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};

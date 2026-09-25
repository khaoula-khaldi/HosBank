const adminRepository = require('../../repositories/admin/admin.repository');

const ALLOWED_ROLES = new Set(['USER', 'CHARGE_CLIENT', 'ADMIN']);

function validationError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function parseId(value, label) {
    if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > 2147483647) {
        throw validationError(`${label} invalide.`);
    }
    return Number(value);
}

const adminService = {
    async getDashboardStats() {
        return adminRepository.getDashboardStats();
    },

    async getDashboardData() {
        const [stats, users, accountRequests] = await Promise.all([
            adminRepository.getDashboardStats(),
            adminRepository.listUsers(),
            adminRepository.listAccountRequests()
        ]);
        return { stats, users, accountRequests };
    },

    async updateUserRole(userId, role) {
        const id = parseId(userId, 'Utilisateur');
        if (!ALLOWED_ROLES.has(role)) {
            throw validationError('Rôle invalide.');
        }
        const user = await adminRepository.updateUserRole(id, role);
        if (!user) throw validationError('Utilisateur introuvable.', 404);
        return user;
    },

    async approveAccountRequest(requestId) {
        return adminRepository.approveAccountRequest(parseId(requestId, 'Demande'));
    },

    async rejectAccountRequest(requestId) {
        const id = parseId(requestId, 'Demande');
        const request = await adminRepository.rejectAccountRequest(id);
        if (!request) throw validationError('Demande introuvable ou déjà traitée.', 409);
        return request;
    }
};

module.exports = adminService;

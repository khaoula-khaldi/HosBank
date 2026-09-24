const adminRepository = require('../../repositories/admin/admin.repository');

const adminService = {
    async getDashboardStats() {
        return await adminRepository.getDashboardStats();
    }
};

module.exports = adminService;

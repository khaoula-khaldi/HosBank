const adminService = require('../../services/admin/admin.service');

const adminController = {
    async showDashboard(req, res) {
        try {
            const stats = await adminService.getDashboardStats();
            res.render('admin/dashboard', { stats });
        } catch (error) {
            console.error("Admin Dashboard Error:", error);
            res.status(500).send("Erreur lors du chargement du tableau de bord admin.");
        }
    }
};

module.exports = adminController;

const adminService = require('../../services/admin/admin.service');

const adminController = {
    async showDashboard(req, res) {
        try {
            const data = await adminService.getDashboardData();
            const messages = {
                roleUpdated: 'Rôle utilisateur mis à jour.',
                requestApproved: 'Demande approuvée et compte épargne créé.',
                requestRejected: 'Demande refusée.'
            };
            res.render('admin/dashboard', {
                ...data,
                message: messages[req.query.message] || null
            });
        } catch (error) {
            console.error('Admin Dashboard Error:', error);
            res.status(500).send('Erreur lors du chargement du tableau de bord admin.');
        }
    },

    async updateUserRole(req, res) {
        try {
            await adminService.updateUserRole(req.params.id, req.body.role);
            res.redirect('/admin/dashboard?message=roleUpdated');
        } catch (error) {
            res.status(error.status || 500).send(error.status ? error.message : 'Erreur lors de la modification du rôle.');
        }
    },

    async approveAccountRequest(req, res) {
        try {
            await adminService.approveAccountRequest(req.params.id);
            res.redirect('/admin/dashboard?message=requestApproved');
        } catch (error) {
            res.status(error.status || 500).send(error.status ? error.message : 'Erreur lors de l’approbation de la demande.');
        }
    },

    async rejectAccountRequest(req, res) {
        try {
            await adminService.rejectAccountRequest(req.params.id);
            res.redirect('/admin/dashboard?message=requestRejected');
        } catch (error) {
            res.status(error.status || 500).send(error.status ? error.message : 'Erreur lors du refus de la demande.');
        }
    }
};

module.exports = adminController;

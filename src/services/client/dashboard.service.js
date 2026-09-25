const dashboardRepository = require("../../repositories/client/dashboard.repository");

async function getDashboard(userId) {
    const user = await dashboardRepository.findById(userId);
    const accounts = await dashboardRepository.getAccounts(userId);
    const accountRequests = await dashboardRepository.getAccountRequests(userId);
    const activities = await dashboardRepository.getRecentActivities(userId);
    const virements = await dashboardRepository.getVirement(userId);

    return {
        user,
        accounts,
        accountRequests,
        activities,
        virements
    };
}

module.exports = getDashboard;

const dashboardRepository = require("../../repositories/client/dashboard.repository");

async function getDashboard(userId){
    const user = await dashboardRepository.findById(userId);

    const balance = await dashboardRepository.getBalance(userId);

    const activities = await dashboardRepository.getRecentActivities(userId);

    return {
        user,
        balance,
        activities
    };

}

module.exports = getDashboard;
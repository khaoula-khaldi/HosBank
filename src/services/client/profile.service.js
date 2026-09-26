const profileRepository =
    require("../../repositories/client/profile.repository");

const profileService = {

    async getProfile(userId) {

        return await profileRepository.findById(userId);

    }
};

module.exports = profileService;
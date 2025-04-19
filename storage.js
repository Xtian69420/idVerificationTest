// Simple in-memory storage for testing (replace with database in production)
const storage = {
    applicants: {},
    verifications: {},
  
    saveApplicant(userId, data) {
      this.applicants[userId] = data;
    },
  
    getApplicant(userId) {
      return this.applicants[userId];
    },
  
    saveVerificationResults(userId, results) {
      this.verifications[userId] = {
        ...results,
        applicantData: this.applicants[userId]
      };
    },
  
    getVerificationResults(userId) {
      return this.verifications[userId];
    }
  };
  
  module.exports = storage;
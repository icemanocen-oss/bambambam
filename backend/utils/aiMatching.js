/**
 * Simple AI Matching Algorithm
 * Matches users based on shared interests, skills, and user type
 */

class AIMatchingService {
  /**
   * Calculate match score between two users
   * @param {Object} user1 - First user
   * @param {Object} user2 - Second user
   * @returns {Number} - Match score (0-100)
   */
  static calculateMatchScore(user1, user2) {
    let score = 0;

    // Check if users are not the same
    if (user1._id.toString() === user2._id.toString()) {
      return 0;
    }

    // Check if user is blocked
    if (user1.blockedUsers?.includes(user2._id) || user2.blockedUsers?.includes(user1._id)) {
      return 0;
    }

    // 1. Common Interests (40 points max)
    const commonInterests = this.findCommonElements(user1.interests || [], user2.interests || []);
    const interestScore = Math.min(commonInterests.length * 10, 40);
    score += interestScore;

    // 2. Common Skills (30 points max)
    const commonSkills = this.findCommonElements(user1.skills || [], user2.skills || []);
    const skillScore = Math.min(commonSkills.length * 10, 30);
    score += skillScore;

    // 3. Same User Type (15 points)
    if (user1.userType === user2.userType) {
      score += 15;
    }

    // 4. Age Proximity (10 points max)
    if (user1.age && user2.age) {
      const ageDiff = Math.abs(user1.age - user2.age);
      const ageScore = Math.max(10 - ageDiff, 0);
      score += ageScore;
    }

    // 5. Same Location (5 points)
    if (user1.location && user2.location && 
        user1.location.toLowerCase() === user2.location.toLowerCase()) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Find common elements between two arrays
   */
  static findCommonElements(arr1, arr2) {
    return arr1.filter(item => 
      arr2.some(item2 => 
        item.toLowerCase() === item2.toLowerCase()
      )
    );
  }

  /**
   * Find best matches for a user
   * @param {Object} currentUser - User to find matches for
   * @param {Array} allUsers - All available users
   * @param {Number} limit - Maximum number of matches to return
   * @returns {Array} - Sorted array of matched users with scores
   */
  static findMatches(currentUser, allUsers, limit = 10) {
    const matches = [];

    for (const user of allUsers) {
      const score = this.calculateMatchScore(currentUser, user);
      
      if (score > 0) {
        matches.push({
          user: user,
          matchScore: score,
          commonInterests: this.findCommonElements(
            currentUser.interests || [], 
            user.interests || []
          ),
          commonSkills: this.findCommonElements(
            currentUser.skills || [], 
            user.skills || []
          )
        });
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches
    return matches.slice(0, limit);
  }

  /**
   * Recommend groups for a user based on interests
   */
  static recommendGroups(user, allGroups, limit = 5) {
    const recommendations = [];

    for (const group of allGroups) {
      // Skip if already a member
      if (group.members?.includes(user._id)) {
        continue;
      }

      // Calculate relevance score
      let score = 0;
      
      const commonInterests = this.findCommonElements(
        user.interests || [], 
        group.interests || []
      );
      
      score = commonInterests.length * 20;

      if (score > 0) {
        recommendations.push({
          group: group,
          relevanceScore: score,
          matchedInterests: commonInterests
        });
      }
    }

    // Sort by relevance
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return recommendations.slice(0, limit);
  }
}

module.exports = AIMatchingService;

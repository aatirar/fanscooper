const fs = require('fs');
const path = require('path');

class LeaderboardGenerator {
  constructor() {
    this.config = this.loadScoringConfig();
  }

  /**
   * Load scoring configuration from JSON file
   * @returns {Object} - Scoring configuration
   */
  loadScoringConfig() {
    try {
      const configPath = path.join(process.cwd(), 'config', 'scoring.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.warn('Failed to load scoring config, using defaults:', error.message);
      return {
        scoring: {
          reaction: 1,
          comment: 1,
          repost: 1
        }
      };
    }
  }

  /**
   * Get the largest profile picture URL from an array of profile pictures
   * @param {Array} profilePictures - Array of profile picture objects
   * @returns {string} - URL of the largest profile picture
   */
  getLargestProfilePicture(profilePictures) {
    if (!profilePictures || profilePictures.length === 0) {
      return null;
    }

    // Find the picture with the largest width
    const largest = profilePictures.reduce((max, current) => {
      return (current.width > max.width) ? current : max;
    });

    return largest.url;
  }

  /**
   * Normalize person data from different API responses
   * @param {Object} person - Person data from API
   * @param {string} source - Source of the data (reaction, comment, repost)
   * @returns {Object} - Normalized person data
   */
  normalizePerson(person, source) {
    let normalized = {
      id: null,
      name: null,
      profileUrl: null,
      displayPic: null
    };

    switch (source) {
      case 'reaction':
        normalized.id = person.urn;
        normalized.name = person.fullName;
        normalized.profileUrl = person.profileUrl;
        normalized.displayPic = this.getLargestProfilePicture(person.profilePicture);
        break;
        
      case 'comment':
        normalized.id = person.author.urn;
        normalized.name = person.author.name;
        normalized.profileUrl = person.author.linkedinUrl;
        normalized.displayPic = null; // Comments API doesn't provide profile pictures
        break;
        
      case 'repost':
        normalized.id = person.urn;
        normalized.name = person.fullName;
        normalized.profileUrl = person.profileUrl;
        normalized.displayPic = this.getLargestProfilePicture(person.profilePicture);
        break;
    }

    return normalized;
  }

  /**
   * Aggregate engagement data into person-based metrics
   * @param {Object} engagementData - Raw engagement data from LinkedIn API
   * @returns {Map} - Map of person ID to aggregated data
   */
  aggregateEngagementByPerson(engagementData) {
    const personMap = new Map();

    for (const post of engagementData.posts) {
      // Process reactions
      for (const reaction of post.reactions) {
        const person = this.normalizePerson(reaction, 'reaction');
        if (!person.id) continue;

        if (!personMap.has(person.id)) {
          personMap.set(person.id, {
            ...person,
            reactions: 0,
            comments: 0,
            reposts: 0,
            totalEngagement: 0,
            totalScore: 0
          });
        }

        const entry = personMap.get(person.id);
        entry.reactions++;
        entry.totalEngagement++;

        // Update profile info if we have better data
        if (person.displayPic && !entry.displayPic) {
          entry.displayPic = person.displayPic;
        }
      }

      // Process comments
      for (const comment of post.comments) {
        const person = this.normalizePerson(comment, 'comment');
        if (!person.id) continue;

        if (!personMap.has(person.id)) {
          personMap.set(person.id, {
            ...person,
            reactions: 0,
            comments: 0,
            reposts: 0,
            totalEngagement: 0,
            totalScore: 0
          });
        }

        const entry = personMap.get(person.id);
        entry.comments++;
        entry.totalEngagement++;
      }

      // Process reposts
      for (const repost of post.reposts) {
        const person = this.normalizePerson(repost, 'repost');
        if (!person.id) continue;

        if (!personMap.has(person.id)) {
          personMap.set(person.id, {
            ...person,
            reactions: 0,
            comments: 0,
            reposts: 0,
            totalEngagement: 0,
            totalScore: 0
          });
        }

        const entry = personMap.get(person.id);
        entry.reposts++;
        entry.totalEngagement++;

        // Update profile info if we have better data
        if (person.displayPic && !entry.displayPic) {
          entry.displayPic = person.displayPic;
        }
      }
    }

    return personMap;
  }

  /**
   * Calculate scores for each person based on configuration
   * @param {Map} personMap - Map of person data
   * @returns {Array} - Array of people with calculated scores
   */
  calculateScores(personMap) {
    const people = Array.from(personMap.values());

    for (const person of people) {
      person.totalScore = 
        (person.reactions * this.config.scoring.reaction) +
        (person.comments * this.config.scoring.comment) +
        (person.reposts * this.config.scoring.repost);
    }

    return people;
  }

  /**
   * Generate ranked leaderboard
   * @param {Object} engagementData - Raw engagement data from LinkedIn API
   * @returns {Object} - Complete leaderboard response
   */
  generateLeaderboard(engagementData) {
    // Aggregate engagement by person
    const personMap = this.aggregateEngagementByPerson(engagementData);
    
    // Calculate scores
    const people = this.calculateScores(personMap);
    
    // Sort by total score (descending), then by total engagement (descending)
    people.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.totalEngagement - a.totalEngagement;
    });

    // Add rank to each person
    const leaderboard = people.map((person, index) => ({
      rank: index + 1,
      name: person.name,
      "profile url": person.profileUrl,
      "display pic": person.displayPic,
      reactions: person.reactions,
      comments: person.comments,
      reposts: person.reposts,
      "total engagement": person.totalEngagement,
      "total score": person.totalScore
    }));

    // Create response with metadata
    return {
      success: true,
      data: {
        leaderboard: leaderboard,
        metadata: {
          totalPeople: leaderboard.length,
          postsAnalyzed: engagementData.aggregates.postsAnalyzed,
          aggregates: {
            totalReactions: engagementData.aggregates.totalReactions,
            totalComments: engagementData.aggregates.totalComments,
            totalReposts: engagementData.aggregates.totalReposts,
            totalEngagement: engagementData.aggregates.totalReactions + 
                           engagementData.aggregates.totalComments + 
                           engagementData.aggregates.totalReposts
          },
          scoringConfig: this.config.scoring,
          errors: engagementData.errors.length > 0 ? engagementData.errors : null
        }
      }
    };
  }
}

module.exports = LeaderboardGenerator; 
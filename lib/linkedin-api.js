class LinkedInAPI {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.baseHeaders = {
      'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com',
      'x-rapidapi-key': this.apiKey,
    };
  }

  /**
   * Extract username from LinkedIn URL
   * @param {string} linkedinUrl - LinkedIn profile URL
   * @returns {string} - Username
   */
  extractUsername(linkedinUrl) {
    const match = linkedinUrl.match(/\/in\/([^/?]+)/);
    return match ? match[1] : null;
  }

  /**
   * Calculate date filter for posts based on days parameter
   * @param {number} days - Number of days to look back
   * @returns {string} - Date string in YYYY-MM-DD HH:MM format
   */
  calculateDateFilter(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }

  /**
   * Get profile posts with pagination until we reach the specified timeframe
   * @param {string} username - LinkedIn username
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} - Array of posts
   */
  async getProfilePosts(username, days) {
    console.log(`📝 Starting to fetch posts for username: ${username} (last ${days} days)`);
    const posts = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    console.log(`📅 Cutoff date: ${cutoffDate.toISOString()}`);
    
    let start = 0;
    let paginationToken = null;
    let hasMorePosts = true;
    let pageCount = 0;

    while (hasMorePosts) {
      try {
        pageCount++;
        console.log(`📄 Fetching posts page ${pageCount} (start: ${start})`);
        
        const url = new URL('https://linkedin-api8.p.rapidapi.com/get-profile-posts');
        url.searchParams.append('username', username);
        url.searchParams.append('start', start.toString());
        
        if (paginationToken) {
          url.searchParams.append('paginationToken', paginationToken);
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: this.baseHeaders,
        });

        if (!response.ok) {
          throw new Error(`Posts API failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
          console.log(`✅ No more posts found on page ${pageCount}`);
          break;
        }

        console.log(`📋 Found ${data.data.length} posts on page ${pageCount}`);

        // Filter posts by date and add to results
        let addedFromThisPage = 0;
        for (const post of data.data) {
          const postDate = new Date(post.postedDateTimestamp);
          
          if (postDate < cutoffDate) {
            console.log(`⏰ Reached post older than cutoff date. Stopping pagination.`);
            hasMorePosts = false;
            break;
          }
          
          posts.push(post);
          addedFromThisPage++;
        }

        console.log(`✅ Added ${addedFromThisPage} posts from page ${pageCount}. Total posts: ${posts.length}`);

        // Prepare for next pagination
        start += 50;
        paginationToken = data.paginationToken;
        
        // If no pagination token, we've reached the end
        if (!paginationToken) {
          console.log(`🏁 No more pagination token. Finished fetching posts.`);
          break;
        }

      } catch (error) {
        console.error('❌ Error fetching posts:', error);
        break;
      }
    }

    console.log(`📊 Total posts fetched: ${posts.length}`);
    return posts;
  }

  /**
   * Get all reactions for a post with pagination
   * @param {string} postUrl - Post URL or URN
   * @returns {Promise<Array>} - Array of reactions
   */
  async getPostReactions(postUrl) {
    console.log(`👍 Fetching reactions for post: ${postUrl.substring(0, 50)}...`);
    const reactions = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        console.log(`  📄 Reactions page ${currentPage}`);
        const response = await fetch('https://linkedin-api8.p.rapidapi.com/get-post-reactions', {
          method: 'POST',
          headers: {
            ...this.baseHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: postUrl,
            page: currentPage,
            reactionType: ""
          }),
        });

        if (!response.ok) {
          throw new Error(`Reactions API failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data || !data.data.items) {
          console.log(`  ✅ No more reactions on page ${currentPage}`);
          break;
        }

        reactions.push(...data.data.items);
        console.log(`  📋 Found ${data.data.items.length} reactions on page ${currentPage}. Total: ${reactions.length}`);

        // Check if there are more pages
        const totalPages = Math.ceil(data.data.total / 10); // Assuming 10 per page
        if (currentPage >= totalPages) {
          hasMorePages = false;
        } else {
          currentPage++;
        }

      } catch (error) {
        console.error('  ❌ Error fetching reactions:', error);
        break;
      }
    }

    console.log(`  ✅ Total reactions: ${reactions.length}`);
    return reactions;
  }

  /**
   * Get all comments for a post with pagination
   * @param {string} urn - Post URN
   * @returns {Promise<Array>} - Array of comments
   */
  async getPostComments(urn) {
    console.log(`💬 Fetching comments for post: ${urn}`);
    const comments = [];
    let currentPage = 1;
    let paginationToken = null;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        console.log(`  📄 Comments page ${currentPage}`);
        const url = new URL('https://linkedin-api8.p.rapidapi.com/get-profile-posts-comments');
        url.searchParams.append('urn', urn);
        url.searchParams.append('sort', 'mostRelevant');
        url.searchParams.append('page', currentPage.toString());
        
        if (paginationToken) {
          url.searchParams.append('paginationToken', paginationToken);
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: this.baseHeaders,
        });

        if (!response.ok) {
          throw new Error(`Comments API failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
          console.log(`  ✅ No more comments on page ${currentPage}`);
          break;
        }

        comments.push(...data.data);
        console.log(`  📋 Found ${data.data.length} comments on page ${currentPage}. Total: ${comments.length}`);

        // Check if there are more pages
        paginationToken = data.paginationToken;
        if (!paginationToken || currentPage >= data.totalPage) {
          hasMorePages = false;
        } else {
          currentPage++;
        }

      } catch (error) {
        console.error('  ❌ Error fetching comments:', error);
        break;
      }
    }

    console.log(`  ✅ Total comments: ${comments.length}`);
    return comments;
  }

  /**
   * Get all reposts for a post with pagination
   * @param {string} urn - Post URN
   * @returns {Promise<Array>} - Array of reposts
   */
  async getPostReposts(urn) {
    console.log(`🔄 Fetching reposts for post: ${urn}`);
    const reposts = [];
    let currentPage = 1;
    let paginationToken = '';
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        console.log(`  📄 Reposts page ${currentPage}`);
        const response = await fetch('https://linkedin-api8.p.rapidapi.com/posts/reposts', {
          method: 'POST',
          headers: {
            ...this.baseHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            urn: urn,
            page: currentPage,
            paginationToken: paginationToken
          }),
        });

        if (!response.ok) {
          throw new Error(`Reposts API failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.data || !data.data.items) {
          console.log(`  ✅ No more reposts on page ${currentPage}`);
          break;
        }

        reposts.push(...data.data.items);
        console.log(`  📋 Found ${data.data.items.length} reposts on page ${currentPage}. Total: ${reposts.length}`);

        // Check if there are more pages
        paginationToken = data.data.paginationToken;
        if (!paginationToken || currentPage >= data.data.totalPages) {
          hasMorePages = false;
        } else {
          currentPage++;
        }

      } catch (error) {
        console.error('  ❌ Error fetching reposts:', error);
        break;
      }
    }

    console.log(`  ✅ Total reposts: ${reposts.length}`);
    return reposts;
  }

  /**
   * Get comprehensive engagement data for all posts
   * @param {string} linkedinUrl - LinkedIn profile URL
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} - Engagement data and metadata
   */
  async getEngagementData(linkedinUrl, days) {
    console.log(`🚀 Starting engagement data collection for: ${linkedinUrl}`);
    const username = this.extractUsername(linkedinUrl);
    if (!username) {
      throw new Error('Invalid LinkedIn URL format');
    }

    console.log(`👤 Extracted username: ${username}`);

    const posts = await this.getProfilePosts(username, days);
    const engagementData = {
      posts: [],
      aggregates: {
        totalReactions: 0,
        totalComments: 0,
        totalReposts: 0,
        postsAnalyzed: posts.length
      },
      errors: []
    };

    console.log(`\n🔄 Processing ${posts.length} posts for engagement data...`);

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n📝 Processing post ${i + 1}/${posts.length}: ${post.urn}`);
      
      const postData = {
        urn: post.urn,
        url: post.shareUrl || post.postUrl,
        reactions: [],
        comments: [],
        reposts: []
      };

      // Get reactions
      try {
        postData.reactions = await this.getPostReactions(post.shareUrl || post.postUrl);
        engagementData.aggregates.totalReactions += postData.reactions.length;
        console.log(`✅ Post ${i + 1}: ${postData.reactions.length} reactions`);
      } catch (error) {
        console.error(`❌ Post ${i + 1}: Failed to get reactions:`, error.message);
        engagementData.errors.push(`Failed to get reactions for post ${post.urn}: ${error.message}`);
      }

      // Get comments
      try {
        postData.comments = await this.getPostComments(post.urn);
        engagementData.aggregates.totalComments += postData.comments.length;
        console.log(`✅ Post ${i + 1}: ${postData.comments.length} comments`);
      } catch (error) {
        console.error(`❌ Post ${i + 1}: Failed to get comments:`, error.message);
        engagementData.errors.push(`Failed to get comments for post ${post.urn}: ${error.message}`);
      }

      // Get reposts
      try {
        postData.reposts = await this.getPostReposts(post.urn);
        engagementData.aggregates.totalReposts += postData.reposts.length;
        console.log(`✅ Post ${i + 1}: ${postData.reposts.length} reposts`);
      } catch (error) {
        console.error(`❌ Post ${i + 1}: Failed to get reposts:`, error.message);
        engagementData.errors.push(`Failed to get reposts for post ${post.urn}: ${error.message}`);
      }

      console.log(`📊 Post ${i + 1} summary: ${postData.reactions.length}R + ${postData.comments.length}C + ${postData.reposts.length}S = ${postData.reactions.length + postData.comments.length + postData.reposts.length} total engagements`);

      engagementData.posts.push(postData);
    }

    console.log(`\n🎉 Engagement data collection complete!`);
    console.log(`📊 Final totals: ${engagementData.aggregates.totalReactions} reactions, ${engagementData.aggregates.totalComments} comments, ${engagementData.aggregates.totalReposts} reposts`);
    console.log(`📝 Total posts analyzed: ${engagementData.aggregates.postsAnalyzed}`);
    if (engagementData.errors.length > 0) {
      console.log(`⚠️ Errors encountered: ${engagementData.errors.length}`);
    }

    return engagementData;
  }
}

module.exports = LinkedInAPI; 
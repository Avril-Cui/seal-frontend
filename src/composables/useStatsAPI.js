import { ref } from "vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Composable for Stats page API calls
 */
export function useStatsAPI() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch user's wishlist items
   * @param {string} owner - User ID
   * @returns {Promise<Array>} Array of items or empty array
   */
  const fetchWishlist = async (owner) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${API_BASE_URL}/ItemCollection/_getWishListItems`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Data comes back as array of { item: ItemDoc } objects
      return data.map(d => d.item) || [];
    } catch (err) {
      error.value = err.message;
      console.error("Error fetching wishlist:", err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get swipe stats for an item
   * @param {string} ownerUserId - User ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Object|null>} { total, approval } or null
   */
  const getSwipeStats = async (ownerUserId, itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SwipeSystem/_getSwipeStats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerUserId, itemId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        // No swipes exist yet, return null
        return null;
      }

      return { total: data.total, approval: data.approval };
    } catch (err) {
      console.error(`Error fetching swipe stats for item ${itemId}:`, err);
      return null;
    }
  };

  /**
   * Get swipe comments for an item
   * @param {string} ownerUserId - User ID
   * @param {string} itemId - Item ID
   * @returns {Promise<Array>} Array of comment strings
   */
  const getSwipeComments = async (ownerUserId, itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/SwipeSystem/_getSwipeComments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerUserId, itemId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        return [];
      }

      return data.comments || [];
    } catch (err) {
      console.error(`Error fetching swipe comments for item ${itemId}:`, err);
      return [];
    }
  };

  /**
   * Call AI to get wishlist insights
   * @param {string} owner - User ID
   * @param {string} context_prompt - Configured prompt with all data
   * @returns {Promise<string|null>} LLM response or null
   */
  const getAIWishListInsight = async (owner, context_prompt) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(`${API_BASE_URL}/ItemCollection/getAIWishListInsight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner, context_prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data.llm_response;
    } catch (err) {
      error.value = err.message;
      console.error("Error getting AI wishlist insight:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Build prompt template with wishlist and swipe data
   * @param {Array} wishlistItems - Array of item objects
   * @param {Object} swipeDataMap - Map of itemId to { stats, comments }
   * @returns {string} Configured prompt
   */
  const buildInsightPrompt = (wishlistItems, swipeDataMap) => {
    let prompt = `You are a shopping behavior analyst. Analyze the following wishlist and provide insights about the user's shopping patterns.

WISHLIST ITEMS (${wishlistItems.length} total):
`;

    wishlistItems.forEach((item, index) => {
      const swipeData = swipeDataMap[item._id] || { stats: null, comments: [] };
      const stats = swipeData.stats;
      const comments = swipeData.comments;

      prompt += `
${index + 1}. ${item.itemName}
   - Price: $${item.price}
   - User's reason: ${item.reason}
   - Is this a need? ${item.isNeed}
   - Will future self approve? ${item.isFutureApprove}`;

      if (stats) {
        const approvalRate = stats.total > 0 ? ((stats.approval / stats.total) * 100).toFixed(0) : 0;
        prompt += `
   - Community feedback: ${stats.approval}/${stats.total} people think you should buy this (${approvalRate}% approval)`;
      }

      if (comments && comments.length > 0) {
        prompt += `
   - Community comments: ${comments.slice(0, 3).join('; ')}`;
      }

      prompt += '\n';
    });

    prompt += `
Based on this wishlist analysis, please provide TWO separate insights in a specific JSON format:

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format (no additional text):

{
  "trendAlert": "A concise observation about their shopping patterns or trends (1-2 sentences, max 150 characters)",
  "improvementSuggestions": [
    "First actionable suggestion",
    "Second actionable suggestion",
    "Third actionable suggestion",
    "Fourth actionable suggestion"
  ]
}

Guidelines:
- trendAlert: Identify a pattern (e.g., weekend purchases, price ranges, need vs want ratio, community approval patterns)
- improvementSuggestions: Provide exactly 4 specific, actionable tips to improve their purchasing decisions
- Keep all text concise and friendly
- Use "you" to address the user directly
- Be supportive, not judgmental

Respond with ONLY the JSON object, no markdown formatting, no code blocks, no additional explanation.`;

    return prompt;
  };

  return {
    loading,
    error,
    fetchWishlist,
    getSwipeStats,
    getSwipeComments,
    getAIWishListInsight,
    buildInsightPrompt,
  };
}

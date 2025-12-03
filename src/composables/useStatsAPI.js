import { ref } from "vue";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Composable for Stats page API calls
 */
export function useStatsAPI() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch user's wishlist items
   * @param {string} owner - User ID
   * @param {string} session - Session token for authentication
   * @returns {Promise<Array>} Array of items or empty array
   */
  const fetchWishlist = async (owner, session) => {
    try {
      loading.value = true;
      error.value = null;

      if (!session) {
        throw new Error("Session token is required");
      }

      const response = await fetch(`${API_BASE_URL}/ItemCollection/_getWishListItems`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Data comes back as { items: [...] } from the sync
      return data.items || [];
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
   * @param {string} session - Session token for authentication
   * @param {string} itemId - Item ID
   * @returns {Promise<Object|null>} { total, approval } or null
   */
  const getSwipeStats = async (session, itemId) => {
    try {
      if (!session) {
        throw new Error("Session token is required");
      }

      const response = await fetch(`${API_BASE_URL}/SwipeSystem/_getSwipeStats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session, itemId }),
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
      // If no swipe stats exist, return null (not an error)
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
      const response = await fetch(
        `${API_BASE_URL}/SwipeSystem/_getSwipeComments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ownerUserId, itemId }),
        }
      );

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
   * @param {string} session - Session token
   * @param {string} context_prompt - Configured prompt with all data
   * @returns {Promise<string|null>} LLM response or null
   */
  const getAIWishListInsight = async (session, context_prompt) => {
    try {
      loading.value = true;
      error.value = null;

      const response = await fetch(
        `${API_BASE_URL}/ItemCollection/getAIWishListInsight`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session, context_prompt }),
        }
      );

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
        const approvalRate =
          stats.total > 0
            ? ((stats.approval / stats.total) * 100).toFixed(0)
            : 0;
        prompt += `
   - Community feedback: ${stats.approval}/${stats.total} people think you should buy this (${approvalRate}% approval)`;
      }

      if (comments && comments.length > 0) {
        prompt += `
   - Community comments: ${comments.slice(0, 3).join("; ")}`;
      }

      prompt += "\n";
    });

    prompt += `
Based on this wishlist analysis, please provide TWO separate insights in a specific JSON format:

IMPORTANT: First, check if there is enough information to provide meaningful insights:
- If there are fewer than 3 items in the wishlist, OR
- If there is insufficient data about the user's shopping patterns

Then respond with an encouraging message asking them to use the app more.

You must respond with ONLY a valid JSON object in this exact format (no additional text, no markdown, no code blocks):

If INSUFFICIENT DATA:
{
  "trendAlert": "We need more data to analyze your shopping patterns. Add more items to your wishlist and continue using ByeBuy to get personalized insights!",
  "improvementSuggestions": [
    "Add at least 5-10 items to your wishlist to help us understand your preferences",
    "Complete reflection questions thoughtfully for each item",
    "Review items from other users to build community data",
    "Use the app for a few weeks to establish shopping patterns"
  ]
}

If SUFFICIENT DATA:
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
- trendAlert: Identify a pattern (e.g., weekend purchases, price ranges, need vs want ratio, community approval patterns). IMPORTANT: Keep trendAlert to approximately 30 words.
- improvementSuggestions: Provide exactly 4 specific, actionable tips to improve their purchasing decisions
- Keep all text concise and friendly
- Use "you" to address the user directly
- Be supportive, not judgmental
- IMPORTANT: Use a playful pig mascot tone. You can add "Oink oink!" at the beginning of the trendAlert or use pig-related phrases, but keep it subtle and don't overdo it. Stay professional while being fun.

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

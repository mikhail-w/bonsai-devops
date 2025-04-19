import axios from 'axios';

// Explicitly define the API URL with a fallback
// Adding console.log to debug the environment variable
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
// Hard-coded API URL to ensure it works
const API_URL = 'http://localhost:8000/api';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get random quote with retry logic
const getRandomQuote = async (retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Using the exact endpoint path we saw in the browser
      const endpoint = `${API_URL}/quotes/random/`;
      console.log(`Attempting to fetch quote from: ${endpoint}`);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          // Add CORS headers
          'Accept': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      };

      const response = await axios.get(endpoint, config);
      console.log('Quote response:', response.data);
      
      // Check if we have valid data
      if (!response.data || !response.data.content) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid quote data received');
      }
      
      return {
        content: response.data.content,
        author: response.data.author,
        tags: response.data.tags || []
      };
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
      } else if (error.request) {
        console.error('No response received, request details:', error.request);
      }
      
      if (attempt === retries) {
        // If this was the last attempt, throw the error
        const message =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          error.message ||
          'Failed to fetch quote';
        throw new Error(message);
      }
      
      // Wait before retrying
      await wait(delay);
    }
  }
};

// Fallback quotes in case the API is completely unavailable
const getFallbackQuote = () => {
  const fallbackQuotes = [
    {
      content: "The best time to plant a tree was 20 years ago. The second best time is now.",
      author: "Chinese Proverb",
      tags: ["wisdom", "inspiration"]
    },
    {
      content: "In the world of bonsai, patience is not just a virtue—it's an art form.",
      author: "Japanese Proverb",
      tags: ["bonsai", "patience"]
    },
    {
      content: "Like a bonsai tree, personal growth requires careful pruning and constant attention.",
      author: "Zen Teaching",
      tags: ["growth", "mindfulness"]
    }
  ];
  
  return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
};

const quoteService = {
  getRandomQuote,
  getFallbackQuote,
};

export default quoteService;
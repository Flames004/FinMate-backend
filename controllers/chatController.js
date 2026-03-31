const ollama = require("ollama").default;

// Controller to handle conversation logic
const generateChatResponse = async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format. Must be an array of objects with {role, content}." });
  }

  // Define the master system prompt to rigidly adhere to financial context
  const systemPrompt = {
    role: "system",
    content: `You are an AI financial assistant for FinMate, an app dedicated to personal finance, budgeting, investing, and economics.
    YOUR CORE DIRECTIVE: 
    1. Only answer questions related to personal finance, budgeting, investing, economics, savings, trading, taxes, or general financial literacy.
    2. If the user asks ANY question outside of these topics (like programming, history, general chatter not tied to finance, etc.), you MUST politely decline and remind them that you can only discuss financial topics.
    3. Keep your answers concise, clear, and helpful. Format your responses with markdown if it helps readability.
    4. Provide factual information but remind users that you are an AI assistant, not a certified financial advisor.`
  };

  const payloadMessages = [systemPrompt, ...messages];

  try {
    const response = await ollama.chat({
      model: "llama3.2", // Switched to llama3.2 to run on lower memory specs
      messages: payloadMessages,
      stream: false, 
    });

    return res.status(200).json({ reply: response.message });
  } catch (error) {
    console.error("Ollama Chat Error:", error);
    
    // Handle memory errors gracefuly
    if (error.message && error.message.includes("requires more system memory")) {
      return res.status(500).json({ error: "Your computer does not have enough memory to run this AI model. Try using a lighter model." });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "Llama model service is currently unavailable. Please ensure Ollama is running." });
    }
    return res.status(500).json({ error: "An error occurred while communicating with the AI model." });
  }
};

module.exports = {
  generateChatResponse,
};

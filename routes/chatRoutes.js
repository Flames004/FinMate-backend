const express = require("express");
const { generateChatResponse } = require("../controllers/chatController");

const router = express.Router();

// Route: POST /api/chat
// Description: Interact with Ollama Llama3 model
router.post("/", generateChatResponse);

module.exports = router;

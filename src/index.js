import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import dotenv from "dotenv";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for user data
const userData = new Map();

// Helper functions for user data management
function getUserData(userId) {
  if (!userData.has(userId)) {
    userData.set(userId, { todos: [], notes: [] });
  }
  return userData.get(userId);
}

function addTodo(userId, text) {
  const user = getUserData(userId);
  const todo = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  user.todos.push(todo);
  return todo;
}

function getTodos(userId) {
  const user = getUserData(userId);
  return user.todos;
}

function toggleTodo(userId, todoId) {
  const user = getUserData(userId);
  const todo = user.todos.find(t => t.id === todoId);
  if (todo) {
    todo.completed = !todo.completed;
    return todo;
  }
  return null;
}

// Create and configure MCP Server instance
const mcpServer = new McpServer({
  name: "todo-mcp-server", 
  version: "0.0.1",
});

// Store tool handlers for manual invocation
const toolHandlers = {};

// Register MCP tools using the new API
mcpServer.tool(
  "add_todo",
  "Add a new todo item",
  {
    text: z.string().describe("The content of the todo item"),
  },
  async (input, extra) => {
    const user = extra?.user;
    if (!user) {
      throw new Error("Authentication required");
    }

    const userId = user.id || user.sub || user.email;
    if (!userId) {
      throw new Error("User ID not found in authentication context");
    }

    const todo = addTodo(userId, input.text);
    console.log(`Added todo for user ${userId}:`, todo);
    
    return {
      content: [
        {
          type: "text",
          text: `Todo added successfully: "${todo.text}" (ID: ${todo.id})`,
        },
      ],
    };
  }
);

// Store handler for manual invocation
toolHandlers["add_todo"] = async (args, user) => {
  const userId = user.id || user.sub || user.email;
  if (!userId) {
    throw new Error("User ID not found in authentication context");
  }
  
  const { text } = args;
  if (!text || typeof text !== "string") {
    throw new Error("Text is required and must be a string");
  }
  
  const todo = addTodo(userId, text);
  console.log(`Added todo for user ${userId}:`, todo);
  
  return {
    content: [
      {
        type: "text",
        text: `Todo added successfully: "${todo.text}" (ID: ${todo.id})`,
      },
    ],
  };
};

mcpServer.tool(
  "list_todos",
  "List all todos for the authenticated user",
  {},
  async (input, extra) => {
    const user = extra?.user;
    if (!user) {
      throw new Error("Authentication required");
    }

    const userId = user.id || user.sub || user.email;
    if (!userId) {
      throw new Error("User ID not found in authentication context");
    }

    const todos = getTodos(userId);
    console.log(`Listed ${todos.length} todos for user ${userId}`);
    
    const todoList = todos.map(todo => 
      `${todo.completed ? "✅" : "⏳"} ${todo.text} (ID: ${todo.id})`
    ).join("\n");
    
    return {
      content: [
        {
          type: "text",
          text: todos.length > 0 
            ? `Your todos:\n${todoList}` 
            : "No todos found. Add some todos to get started!",
        },
      ],
    };
  }
);

// Store handler for manual invocation
toolHandlers["list_todos"] = async (args, user) => {
  const userId = user.id || user.sub || user.email;
  if (!userId) {
    throw new Error("User ID not found in authentication context");
  }

  const todos = getTodos(userId);
  console.log(`Listed ${todos.length} todos for user ${userId}`);
  
  const todoList = todos.map(todo => 
    `${todo.completed ? "✅" : "⏳"} ${todo.text} (ID: ${todo.id})`
  ).join("\n");
  
  return {
    content: [
      {
        type: "text",
        text: todos.length > 0 
          ? `Your todos:\n${todoList}` 
          : "No todos found. Add some todos to get started!",
      },
    ],
  };
};

mcpServer.tool(
  "toggle_todo",
  "Toggle completion status of a todo",
  {
    todoId: z.string().describe("The ID of the todo to toggle"),
  },
  async (input, extra) => {
    const user = extra?.user;
    if (!user) {
      throw new Error("Authentication required");
    }

    const userId = user.id || user.sub || user.email;
    if (!userId) {
      throw new Error("User ID not found in authentication context");
    }

    const todo = toggleTodo(userId, input.todoId);
    if (!todo) {
      throw new Error(`Todo with ID ${input.todoId} not found`);
    }
    
    console.log(`Toggled todo ${input.todoId} for user ${userId}:`, todo);
    
    return {
      content: [
        {
          type: "text",
          text: `Todo "${todo.text}" marked as ${todo.completed ? "completed" : "incomplete"}`,
        },
      ],
    };
  }
);

// Store handler for manual invocation
toolHandlers["toggle_todo"] = async (args, user) => {
  const userId = user.id || user.sub || user.email;
  if (!userId) {
    throw new Error("User ID not found in authentication context");
  }

  const { todoId } = args;
  if (!todoId || typeof todoId !== "string") {
    throw new Error("Todo ID is required and must be a string");
  }
  
  const todo = toggleTodo(userId, todoId);
  if (!todo) {
    throw new Error(`Todo with ID ${todoId} not found`);
  }
  
  console.log(`Toggled todo ${todoId} for user ${userId}:`, todo);
  
  return {
    content: [
      {
        type: "text",
        text: `Todo "${todo.text}" marked as ${todo.completed ? "completed" : "incomplete"}`,
      },
    ],
  };
};

// Express routes
async function setupRoutes() {
  // Middleware to verify Civic Auth token
  const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please provide a valid Bearer token from Civic Auth" 
      });
    }

    // In a real implementation, you would verify the JWT token here
    // For now, we'll extract user info from the token payload
    // You should use a proper JWT library to verify the token signature
    try {
      const token = authHeader.slice(7); // Remove 'Bearer ' prefix
      
      // Mock user extraction - in production, verify and decode the JWT
      // const decoded = jwt.verify(token, publicKey);
      // For demo purposes, we'll create a mock user with fixed ID
      const mockUser = {
        id: "demo_user_123", // Fixed ID for all demo sessions
        email: "demo@example.com",
        sub: "civic_user_123",
        name: "Demo User"
      };
      
      req.user = mockUser;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ 
        error: "Invalid token",
        message: "The provided authentication token is invalid" 
      });
    }
  };

  // Health check endpoint (public)
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../public')));

  // Root route serves the demo client
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Auth info endpoint (public) - provides client configuration
  app.get("/auth-config", (req, res) => {
    const clientId = process.env.CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'CLIENT_ID not configured'
      });
    }
    
    res.json({
      clientId: clientId,
      authEndpoint: "https://auth.civic.com",
      message: "Use Civic Auth client-side to get authentication token"
    });
  });

  // Protected MCP endpoint
  app.post("/mcp", verifyAuth, async (req, res, next) => {
    try {
      // Get user from auth middleware
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "User not found in request context"
        });
      }

      const { method, params } = req.body;
      
      console.log(`MCP Request: method=${method}, user=${user.id || user.email}`);
      
      if (method === "tools/list") {
        // Return the list of available tools
        res.json({
          tools: [
            {
              name: "add_todo",
              description: "Add a new todo item",
              inputSchema: {
                type: "object",
                properties: {
                  text: { type: "string", description: "The content of the todo item" }
                },
                required: ["text"]
              }
            },
            {
              name: "list_todos", 
              description: "List all todos for the authenticated user",
              inputSchema: { type: "object", properties: {} }
            },
            {
              name: "toggle_todo",
              description: "Toggle completion status of a todo",
              inputSchema: {
                type: "object",
                properties: {
                  todoId: { type: "string", description: "The ID of the todo to toggle" }
                },
                required: ["todoId"]
              }
            }
          ]
        });
        
      } else if (method === "tools/call") {
        // Handle tool calls using our stored handlers
        const { name, arguments: args } = params;
        console.log(`Tool call: ${name} with args:`, args);

        if (!toolHandlers[name]) {
          throw new Error(`Unknown tool: ${name}`);
        }
        
        const result = await toolHandlers[name](args, user);
        res.json(result);
        
      } else {
        res.json({ 
          message: "MCP server endpoint",
          user: { id: user.id || user.sub || user.email },
          availableMethods: ["tools/list", "tools/call"],
          instructions: "Send POST requests with { method, params } in body"
        });
      }
      
    } catch (error) {
      console.error("MCP endpoint error:", error);
      next(error);
    }
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  });
}

// Start the server
async function start() {
  try {
    await setupRoutes();
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Civic Auth MCP Server running on port ${port}`);
      console.log(`📋 Health check: http://localhost:${port}/health`);
      console.log(`🔐 MCP endpoint: http://localhost:${port}/mcp`);
      console.log(`🌐 Demo client: http://localhost:${port}/`);
      console.log(`👤 Client ID: ${process.env.CLIENT_ID || 'Not configured'}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;

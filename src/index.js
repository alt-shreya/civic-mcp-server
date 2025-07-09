import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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

// Create MCP Server with Civic Auth context
function createMcpServer(civicUser) {
  const server = new McpServer({
    name: "civic-todo-mcp-server",
    version: "1.0.0",
  });

  // Store tool handlers for direct invocation
  const toolHandlers = {};

  // Register todo management tools
  server.tool(
    "add_todo",
    "Add a new todo item for the authenticated user",
    {
      text: z.string().describe("The content of the todo item"),
    },
    async (input) => {
      const userId = civicUser.id || civicUser.sub || civicUser.email;
      if (!userId) {
        throw new Error("User ID not found in Civic Auth context");
      }

      const todo = addTodo(userId, input.text);
      console.log(`Added todo for Civic user ${userId}:`, todo);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Todo added: "${todo.text}" (ID: ${todo.id})`,
          },
        ],
      };
    }
  );

  // Store handler for direct invocation
  toolHandlers["add_todo"] = async (args) => {
    const userId = civicUser.id || civicUser.sub || civicUser.email;
    if (!userId) {
      throw new Error("User ID not found in Civic Auth context");
    }

    const { text } = args;
    if (!text || typeof text !== "string") {
      throw new Error("Text is required and must be a string");
    }

    const todo = addTodo(userId, text);
    console.log(`Added todo for Civic user ${userId}:`, todo);
    
    return {
      content: [
        {
          type: "text",
          text: `✅ Todo added: "${todo.text}" (ID: ${todo.id})`,
        },
      ],
    };
  };

  server.tool(
    "list_todos",
    "List all todos for the authenticated user",
    {},
    async () => {
      const userId = civicUser.id || civicUser.sub || civicUser.email;
      if (!userId) {
        throw new Error("User ID not found in Civic Auth context");
      }

      const todos = getTodos(userId);
      console.log(`Listed ${todos.length} todos for Civic user ${userId}`);
      
      if (todos.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "📝 No todos found. Add some todos to get started!",
            },
          ],
        };
      }

      const todoList = todos.map(todo => 
        `${todo.completed ? "✅" : "⏳"} ${todo.text} (ID: ${todo.id})`
      ).join("\n");
      
      return {
        content: [
          {
            type: "text",
            text: `📋 Your todos:\n${todoList}`,
          },
        ],
      };
    }
  );

  // Store handler for direct invocation
  toolHandlers["list_todos"] = async () => {
    const userId = civicUser.id || civicUser.sub || civicUser.email;
    if (!userId) {
      throw new Error("User ID not found in Civic Auth context");
    }

    const todos = getTodos(userId);
    console.log(`Listed ${todos.length} todos for Civic user ${userId}`);
    
    if (todos.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "📝 No todos found. Add some todos to get started!",
          },
        ],
      };
    }

    const todoList = todos.map(todo => 
      `${todo.completed ? "✅" : "⏳"} ${todo.text} (ID: ${todo.id})`
    ).join("\n");
    
    return {
      content: [
        {
          type: "text",
          text: `📋 Your todos:\n${todoList}`,
        },
      ],
    };
  };

  server.tool(
    "toggle_todo",
    "Toggle completion status of a todo",
    {
      todoId: z.string().describe("The ID of the todo to toggle"),
    },
    async (input) => {
      const userId = civicUser.id || civicUser.sub || civicUser.email;
      if (!userId) {
        throw new Error("User ID not found in Civic Auth context");
      }

      const todo = toggleTodo(userId, input.todoId);
      if (!todo) {
        throw new Error(`Todo with ID ${input.todoId} not found`);
      }
      
      console.log(`Toggled todo ${input.todoId} for Civic user ${userId}:`, todo);
      
      return {
        content: [
          {
            type: "text",
            text: `${todo.completed ? "✅" : "⏳"} Todo "${todo.text}" marked as ${todo.completed ? "completed" : "incomplete"}`,
          },
        ],
      };
    }
  );

  // Store handler for direct invocation
  toolHandlers["toggle_todo"] = async (args) => {
    const userId = civicUser.id || civicUser.sub || civicUser.email;
    if (!userId) {
      throw new Error("User ID not found in Civic Auth context");
    }

    const { todoId } = args;
    if (!todoId || typeof todoId !== "string") {
      throw new Error("Todo ID is required and must be a string");
    }

    const todo = toggleTodo(userId, todoId);
    if (!todo) {
      throw new Error(`Todo with ID ${todoId} not found`);
    }
    
    console.log(`Toggled todo ${todoId} for Civic user ${userId}:`, todo);
    
    return {
      content: [
        {
          type: "text",
          text: `${todo.completed ? "✅" : "⏳"} Todo "${todo.text}" marked as ${todo.completed ? "completed" : "incomplete"}`,
        },
      ],
    };
  };

  return { server, toolHandlers };
}

// Get available tools schema for tools/list
function getToolsSchema() {
  return {
    tools: [
      {
        name: "add_todo",
        description: "Add a new todo item for the authenticated user",
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
  };
}

// Express routes
async function setupRoutes() {
  // Middleware to verify Civic Auth token
  const verifyCivicAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: "Authentication required",
        message: "Please provide a valid Bearer token from Civic Auth" 
      });
    }

    try {
      const token = authHeader.slice(7); // Remove 'Bearer ' prefix
      
      // In production, verify the JWT token with Civic's public key
      // const decoded = jwt.verify(token, civicPublicKey);
      // For demo purposes, create a mock user based on token
      const mockCivicUser = {
        id: `civic_${Buffer.from(token).toString('base64').slice(0, 8)}`, // Unique ID per token
        email: "user@civic.example.com",
        sub: `civic_sub_${Date.now()}`,
        name: "Civic User",
        walletAddress: "0x1234...abcd" // Mock wallet address
      };
      
      req.civicUser = mockCivicUser;
      next();
    } catch (error) {
      console.error("Civic Auth verification error:", error);
      return res.status(401).json({ 
        error: "Invalid Civic token",
        message: "The provided Civic Auth token is invalid" 
      });
    }
  };

  // Health check endpoint (public)
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "civic-todo-mcp-server",
      version: "1.0.0"
    });
  });

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../public')));

  // Root route serves the client application
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // Civic Auth configuration endpoint (public)
  app.get("/auth-config", (req, res) => {
    const clientId = process.env.CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'CIVIC_CLIENT_ID not configured in environment variables'
      });
    }
    
    res.json({
      clientId: clientId,
      authEndpoint: "https://auth.civic.com",
      message: "Use Civic Auth SDK for secure authentication",
      scopes: ["openid", "profile", "email"]
    });
  });

  // MCP endpoint with Civic Auth integration
  app.post("/mcp", verifyCivicAuth, async (req, res, next) => {
    try {
      // Get authenticated Civic user
      const civicUser = req.civicUser;
      
      if (!civicUser) {
        return res.status(401).json({
          error: "Civic authentication required",
          message: "No authenticated Civic user found in request context"
        });
      }

      const { method, params } = req.body;
      
      console.log(`MCP Request: method=${method}, from Civic user: ${civicUser.id} (${civicUser.email})`);
      
      if (method === "tools/list") {
        // Return the list of available tools
        res.json(getToolsSchema());
        
      } else if (method === "tools/call") {
        // Handle tool calls using the tool handlers
        const { name, arguments: args } = params;
        console.log(`Tool call: ${name} with args:`, args);

        // Create MCP server and get tool handlers for this user
        const { server, toolHandlers } = createMcpServer(civicUser);
        
        if (!toolHandlers[name]) {
          throw new Error(`Unknown tool: ${name}`);
        }
        
        const result = await toolHandlers[name](args);
        res.json(result);
        
      } else {
        res.json({ 
          message: "Civic Auth MCP Server endpoint",
          user: { 
            id: civicUser.id, 
            email: civicUser.email,
            walletAddress: civicUser.walletAddress 
          },
          availableMethods: ["tools/list", "tools/call"],
          instructions: "Send POST requests with { method, params } in body",
          service: "civic-todo-mcp-server",
          version: "1.0.0"
        });
      }
      
    } catch (error) {
      console.error("MCP endpoint error:", error);
      next(error);
    }
  });

  // Error handling middleware
  app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
}

// Start the Civic Auth MCP Server
async function start() {
  try {
    await setupRoutes();
    
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Civic Auth MCP Server v1.0.0 running on port ${port}`);
      console.log(`📋 Health check: http://localhost:${port}/health`);
      console.log(`🔐 MCP endpoint: http://localhost:${port}/mcp`);
      console.log(`🌐 Client UI: http://localhost:${port}/`);
      console.log(`� Civic Client ID: ${process.env.CLIENT_ID || '❌ Not configured'}`);
      console.log(`📚 Civic Auth Guide: https://docs.civic.com/guides/add-auth-to-mcp`);
      console.log('');
      console.log('✨ Ready to accept MCP requests with Civic Auth!');
    });
  } catch (error) {
    console.error("❌ Failed to start Civic Auth MCP Server:", error);
    process.exit(1);
  }
}

start();

export default app;

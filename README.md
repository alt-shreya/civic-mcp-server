# Civic Auth MCP Server

A modern Model Context Protocol (MCP) server with Civic Auth integration for secure, user-authenticated todo management. Built with the latest MCP SDK patterns and featuring a beautiful shadcn-inspired web interface.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Civic Auth credentials:

```env
PORT=3000
NODE_ENV=development
CLIENT_ID=your-civic-client-id-here
```

### 3. Get Civic Auth Credentials

1. Visit [Civic Auth Dashboard](https://auth.civic.com)
2. Create a new application
3. Copy your Client ID
4. Add it to your `.env.local` file

### 4. Start the Server

```bash
npm start
```

Visit `http://localhost:3000` to access the client interface!

## 🏗️ Architecture

This server implements a **hybrid MCP architecture** that combines:

- **Modern MCP SDK**: Tool registration with `McpServer` and Zod schemas
- **HTTP Compatibility**: Direct HTTP handling for web client integration
- **Civic Auth Context**: Per-user MCP server instances with authentication
- **Type Safety**: Full TypeScript-style validation with Zod

```javascript
// Modern MCP tool registration
server.tool(
  "add_todo",
  "Add a new todo item for the authenticated user",
  {
    text: z.string().describe("The content of the todo item"),
  },
  async (input) => {
    // Tool implementation with Civic user context
  }
);
```

## 🛠️ API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web client interface |
| `/health` | GET | Server health check |
| `/auth-config` | GET | Civic Auth configuration |

### Protected Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/mcp` | POST | MCP protocol endpoint | ✅ Civic Auth Bearer token |

## 🔧 Available MCP Tools

All tools require valid Civic Auth authentication and operate on user-specific data:

### 1. 📝 Add Todo
```json
{
  "method": "tools/call",
  "params": {
    "name": "add_todo",
    "arguments": {
      "text": "Learn about MCP with Civic Auth"
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Todo added: \"Learn about MCP with Civic Auth\" (ID: 1234567890)"
    }
  ]
}
```

### 2. 📋 List Todos
```json
{
  "method": "tools/call",
  "params": {
    "name": "list_todos",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "📋 Your todos:\n⏳ Learn about MCP with Civic Auth (ID: 1234567890)\n✅ Complete project setup (ID: 1234567891)"
    }
  ]
}
```

### 3. ✅ Toggle Todo Completion
```json
{
  "method": "tools/call",
  "params": {
    "name": "toggle_todo",
    "arguments": {
      "todoId": "1234567890"
    }
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "✅ Todo \"Learn about MCP with Civic Auth\" marked as completed"
    }
  ]
}
```

### 4. 📚 List Available Tools
```json
{
  "method": "tools/list"
}
```

**Response:**
```json
{
  "tools": [
    {
      "name": "add_todo",
      "description": "Add a new todo item for the authenticated user",
      "inputSchema": {
        "type": "object",
        "properties": {
          "text": { "type": "string", "description": "The content of the todo item" }
        },
        "required": ["text"]
      }
    }
  ]
}
```

## 🧪 Testing the Integration

### Option 1: Web Client (Recommended)
1. **Start the server**: `npm start`
2. **Open browser**: Navigate to `http://localhost:3000`
3. **Authenticate**: Click "Connect with Civic" (uses mock auth in development)
4. **Test tools**: Add, list, and toggle todos using the beautiful UI

### Option 2: Direct API Testing
```bash
# Test with curl (replace token with actual Civic Auth JWT)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-civic-auth-token" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "add_todo", 
      "arguments": {"text": "Test todo from API"}
    }
  }'
```

### Option 3: MCP Client Integration
Connect with Claude Desktop or other MCP clients:

1. **Add to Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "civic-todos": {
      "command": "node",
      "args": ["path/to/civic-mcp-server/src/index.js"],
      "env": {
        "CLIENT_ID": "your-civic-client-id"
      }
    }
  }
}
```

2. **Restart Claude Desktop** to load the MCP server

## 📁 Project Structure

```
civic-mcp-server/
├── src/
│   └── index.js              # Main server with MCP + Civic Auth
├── public/
│   └── index.html           # Beautiful shadcn-inspired client UI
├── test/
│   └── index.test.js        # Test suite
├── scripts/
│   ├── setup.js            # Setup utilities
│   └── test-client.js      # API testing script
├── .env.example            # Environment template
├── .env.local             # Your configuration (create this)
├── package.json           # Dependencies and scripts
└── README.md             # This documentation
```

## 🔧 Development

### Available Scripts

```bash
npm start       # Start the server (with auto-reload)
npm test        # Run test suite
npm run setup   # Initial project setup
```

### Adding New MCP Tools

1. **Register the tool** in `createMcpServer()`:
```javascript
server.tool(
  "your_tool_name",
  "Tool description for AI",
  {
    param: z.string().describe("Parameter description"),
  },
  async (input) => {
    // Tool implementation with civicUser context
    const userId = civicUser.id;
    // Your logic here...
    return {
      content: [{ type: "text", text: "Tool response" }]
    };
  }
);
```

2. **Add tool handler** for HTTP compatibility:
```javascript
toolHandlers["your_tool_name"] = async (args) => {
  // Same implementation as above
};
```

3. **Update tools schema** in `getToolsSchema()` for tools/list support

### Key Development Features

- 🔄 **Hot Reload**: Server restarts automatically on changes
- 📝 **Comprehensive Logging**: All MCP requests and user actions logged
- 🛡️ **Mock Auth**: Development-friendly authentication for testing
- 🎨 **Modern UI**: shadcn-inspired components for testing tools
- 📊 **Health Monitoring**: Built-in health checks and error handling

## 🔒 Security Features

- ✅ **Civic Auth Integration** - Wallet-based authentication with JWT tokens
- ✅ **User Data Isolation** - Each user's data is completely separated
- ✅ **Input Validation** - All tool inputs validated with Zod schemas
- ✅ **Error Handling** - Comprehensive error handling and sanitization
- ✅ **Token Verification** - Bearer tokens validated on every request
- ✅ **No Data Leakage** - Users can only access their own todos
- ✅ **Development Safety** - Mock auth for local development/testing

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
PORT=3000
CLIENT_ID=your-production-civic-client-id
# Add any additional production variables
```

### Security Considerations
1. **JWT Verification**: Replace mock auth with real Civic JWT verification
2. **HTTPS Only**: Ensure all traffic uses HTTPS in production
3. **Environment Variables**: Never commit `.env.local` to version control
4. **Rate Limiting**: Consider adding rate limiting for API endpoints
5. **Database**: Replace in-memory storage with persistent database

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Ensure all tests pass**: `npm test`
6. **Submit a pull request**

### Contribution Guidelines

- Follow the existing code style and patterns
- Add comprehensive tests for new features
- Update documentation for any API changes
- Ensure backward compatibility when possible
- Add proper error handling and logging

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📚 Resources & Documentation

### Civic Auth
- 📖 [Civic Auth Documentation](https://docs.civic.com)
- 🔧 [Civic MCP Integration Guide](https://docs.civic.com/guides/add-auth-to-mcp)
- 🎯 [Civic Auth Dashboard](https://auth.civic.com)

### Model Context Protocol
- 📋 [MCP Specification](https://modelcontextprotocol.io)
- 🛠️ [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- 🧩 [MCP Server Examples](https://github.com/modelcontextprotocol/servers)

### Development Tools
- ⚡ [Express.js Documentation](https://expressjs.com)
- 🔍 [Zod Validation Library](https://zod.dev)
- 🎨 [shadcn/ui Components](https://ui.shadcn.com)

## 🆘 Support & Troubleshooting

### Common Issues

**Q: Getting "CLIENT_ID not configured" error?**  
A: Make sure you've created `.env.local` and added your Civic Client ID from the dashboard.

**Q: Authentication not working?**  
A: In development, the server uses mock authentication. For production, implement proper Civic JWT verification.

**Q: MCP tools not appearing in Claude Desktop?**  
A: Check your `claude_desktop_config.json` file and ensure the path to the server is correct.

**Q: Getting HTTP 406 errors?**  
A: This was a known issue with the transport layer that has been fixed in the current version.

### Getting Help

For issues related to:
- **Civic Auth**: Check the [Civic Documentation](https://docs.civic.com) or contact Civic support
- **MCP Protocol**: See [MCP Documentation](https://modelcontextprotocol.io) or join the community
- **This Project**: Open an issue in this repository with detailed information

---

**Built with ❤️ using Civic Auth and the Model Context Protocol**

*This project demonstrates the power of combining secure wallet-based authentication with AI tool integration through the MCP standard.*

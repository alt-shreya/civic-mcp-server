# Civic Auth MCP Server

A Model Context Protocol (MCP) server with Civic Auth integration for secure, user-authenticated todo management.

## Features

- 🔐 **Civic Auth Integration** - Secure user authentication
- 📝 **Todo Management** - Add, list, and toggle todos
- 👤 **User-specific Data** - Each user has their own todo list
- 🛡️ **Protected Endpoints** - All operations require authentication
- 🏗️ **MCP Compatible** - Works with MCP clients like Claude Desktop

## Setup Instructions

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

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/health` - Server status check

### MCP Endpoint
- **POST** `/mcp` - MCP protocol endpoint (requires authentication)

## Available MCP Tools

Once authenticated via Civic Auth, you can use these tools:

### 1. Add Todo
```json
{
  "name": "add_todo",
  "arguments": {
    "text": "Your todo text here"
  }
}
```

### 2. List Todos
```json
{
  "name": "list_todos",
  "arguments": {}
}
```

### 3. Toggle Todo Completion
```json
{
  "name": "toggle_todo",
  "arguments": {
    "todoId": "todo-id-here"
  }
}
```

### 4. Get User Info
```json
{
  "name": "get_user_info",
  "arguments": {}
}
```

## Testing the Integration

1. **Start the server**: `npm start`
2. **Check health**: Visit `http://localhost:3000/health`
3. **Test with MCP client**: Use Claude Desktop or another MCP client to connect
4. **Authentication**: The server will prompt for Civic Auth when accessed

## Project Structure

```
civic-mcp-server/
├── src/
│   └── index.js          # Main server file
├── test/
│   └── index.test.js     # Test files
├── public/               # Static assets
├── scripts/              # Utility scripts
├── .env.example          # Environment template
├── .env.local           # Your environment variables (create this)
├── .gitignore           # Git ignore rules
├── LICENSE              # MIT License
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Development

### Available Scripts

- `npm start` - Start the server
- `npm test` - Run tests (configure as needed)

### Adding New Tools

To add new MCP tools:

1. Add the tool definition in the `ListToolsRequestSchema` handler
2. Add the tool logic in the `CallToolRequestSchema` handler
3. Ensure proper user authentication and data isolation

## Security Features

- ✅ **User Authentication** - All endpoints require Civic Auth
- ✅ **Data Isolation** - Each user's data is stored separately
- ✅ **Input Validation** - All tool inputs are validated
- ✅ **Error Handling** - Comprehensive error handling and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Resources

- [Civic Auth Documentation](https://docs.civic.com)
- [MCP Server Guide](https://docs.civic.com/guides/add-auth-to-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io)

## Support

For issues related to:
- **Civic Auth**: Check the [Civic Documentation](https://docs.civic.com)
- **MCP Protocol**: See [MCP Documentation](https://modelcontextprotocol.io)
- **This Project**: Open an issue in this repository

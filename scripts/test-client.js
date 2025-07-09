#!/usr/bin/env node

/**
 * Simple MCP Client for testing the Civic Auth MCP Server
 * This is a basic example to demonstrate how to interact with your server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPServer() {
  console.log('🧪 Testing Civic Auth MCP Server...\n');

  try {
    // Create client and connect
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0"
      },
      {
        capabilities: {}
      }
    );

    // Note: In a real scenario, you'd connect to your server
    // For HTTP transport, you'd use a different approach
    console.log('📝 MCP Client Example');
    console.log('This is a template for testing your MCP server.');
    console.log('To test your server:');
    console.log('1. Start your server: npm start');
    console.log('2. Use Claude Desktop or another MCP client');
    console.log('3. Configure the client to connect to http://localhost:3000/mcp\n');

    // Example tool calls (these would be made through a proper MCP client)
    const exampleToolCalls = [
      {
        name: "add_todo",
        arguments: { text: "Test todo item" }
      },
      {
        name: "list_todos",
        arguments: {}
      },
      {
        name: "get_user_info",
        arguments: {}
      }
    ];

    console.log('🔧 Available tool calls:');
    exampleToolCalls.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}:`, JSON.stringify(tool.arguments, null, 2));
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMCPServer();

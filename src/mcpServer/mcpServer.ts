import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { postgresMcp } from "./postgresMcp";



const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Handle SSE endpoint
app.post('/sse', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                transports[sessionId] = transport;
            }
        });

        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };


        await postgresMcp.connect(transport);
    } else {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: Invalid session state',
            },
            id: null,
        });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await transport.handleRequest(req, res, req.body);
});

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
        // Reuse existing transport
        transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                // Store the transport by session ID
                transports[sessionId] = transport;
            }
        });

        // Clean up transport when closed
        transport.onclose = () => {
            if (transport.sessionId) {
                delete transports[transport.sessionId];
            }
        };

        // ... set up server resources, tools, and prompts ...

        // Connect to the MCP server
        await postgresMcp.connect(transport);
    } else {
        // Invalid request
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
            },
            id: null,
        });
        return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/sse', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: Invalid session state',
            },
            id: null,
        });
        return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
});

// Handle DELETE requests for session termination
app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: Invalid session state',
            },
            id: null,
        });
        return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
});

const port = 3120;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`SSE endpoint: http://localhost:${port}/sse`);
    console.log(`Message endpoints: http://localhost:${port}/messages or /sse`);
});
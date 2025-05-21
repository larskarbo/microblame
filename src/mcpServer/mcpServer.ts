import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js"
import { initPostgresServer } from "./postgresMcp";
import { prisma } from "@/db";



const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};


prisma.pgInstance.findMany().then(instances => {
    console.log(instances.map(instance => {
        return {
            name: instance.name,
            uuid: instance.uuid,
        }
    }));
});
// Handle SSE endpoint
app.post('/sse', async (req, res) => {


    // get uuid from query params
    const uuid = req.query.uuid as string | undefined;
    if (!uuid) {
        res.status(400).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Bad Request: No UUID provided',
            },
            id: null,
        });
        return;
    }


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

        const postgresServer = await initPostgresServer({ uuid });
        console.log("Connecting to postgres server");
        await postgresServer.connect(transport);
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
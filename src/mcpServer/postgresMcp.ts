import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import { prisma } from "@/db";
import { getPostgresJsInstance } from "@/server/utils/pgInstance";
import { decryptPassword } from "@/server/utils/password";

export const initPostgresServer = async ({
    uuid,
}: {
    uuid: string;
}) => {
    console.log('uuid raw:', JSON.stringify(uuid));
    console.log('uuid length:', uuid.length);
    // Clean the UUID to ensure it only contains valid characters
    const cleanUuid = uuid.replace(/[^0-9a-fA-F-]/g, '');
    console.log('cleaned uuid:', cleanUuid);
    
    const instance = await prisma.pgInstance.findUniqueOrThrow({
        where: {
            uuid: cleanUuid
        },
    });


    const server = new Server(
        {
            name: "postgres-mcp",
            version: "0.1.0",
        },
        {
            capabilities: {
                resources: {},
                tools: {},
            },
        },
    );


    const args = process.argv.slice(2);

    const databaseUrl = args[0];

    const DATABASE_URL = process.env.DATABASE_URL || "postgresql://larskarbo@localhost:5432/layer3?schema=public"

    const resourceBaseUrl = new URL(DATABASE_URL);
    resourceBaseUrl.protocol = "postgres:";
    resourceBaseUrl.password = "";


    // user: instance.pgUser,
    // password: await decryptPassword(instance.pgPasswordEncrypted),
    // host: instance.pgHost,
    // port: instance.pgPort,
    // database: instance.pgDatabase,
    // ssl: instance.ssl
    //   ? {
    //       rejectUnauthorized: false,
    //     }
    //   : false,
    // max: 1,
    // idle_timeout: 20, // 20 seconds
    // max_lifetime: 60 * 2, // 2 minutes
    // connection: {
    //   application_name: "postgresjs-microblame",
    // },

    const pool = new pg.Pool({
        user: instance.pgUser,
        password: await decryptPassword(instance.pgPasswordEncrypted),
        host: instance.pgHost,
        port: instance.pgPort,
        database: instance.pgDatabase,
        ssl: instance.ssl
            ? {
                rejectUnauthorized: false,
            }
            : false,
        max: 1,
        application_name: "postgresjs-microblame",

    });

    const SCHEMA_PATH = "schema";

    server.setRequestHandler(ListResourcesRequestSchema, async () => {
        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            );
            return {
                resources: result.rows.map((row) => ({
                    uri: new URL(`${row.table_name}/${SCHEMA_PATH}`, resourceBaseUrl).href,
                    mimeType: "application/json",
                    name: `"${row.table_name}" database schema`,
                })),
            };
        } finally {
            client.release();
        }
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const resourceUrl = new URL(request.params.uri);

        const pathComponents = resourceUrl.pathname.split("/");
        const schema = pathComponents.pop();
        const tableName = pathComponents.pop();

        if (schema !== SCHEMA_PATH) {
            throw new Error("Invalid resource URI");
        }

        const client = await pool.connect();
        try {
            const result = await client.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
                [tableName],
            );

            return {
                contents: [
                    {
                        uri: request.params.uri,
                        mimeType: "application/json",
                        text: JSON.stringify(result.rows, null, 2),
                    },
                ],
            };
        } finally {
            client.release();
        }
    });

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "query",
                    description: "Run a read-only SQL query",
                    inputSchema: {
                        type: "object",
                        properties: {
                            sql: { type: "string" },
                        },
                    },
                },
            ],
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (request.params.name === "query") {
            const sql = request.params.arguments?.sql as string;

            const client = await pool.connect();
            try {
                await client.query("BEGIN TRANSACTION READ ONLY");
                const result = await client.query(sql);
                return {
                    content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
                    isError: false,
                };
            } catch (error) {
                throw error;
            } finally {
                client
                    .query("ROLLBACK")
                    .catch((error) =>
                        console.warn("Could not roll back transaction:", error),
                    );

                client.release();
            }
        }
        throw new Error(`Unknown tool: ${request.params.name}`);
    });

    return server;
}

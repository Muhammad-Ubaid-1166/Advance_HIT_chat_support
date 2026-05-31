"""
MCP Server → talks to our Chat FastAPI app
Tools:
  - send_message  → POST /send
"""

import asyncio
import os
import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("chat-connector")

ADMIN_BACKEND_URL = os.getenv("ADMIN_BACKEND_URL", "http://localhost:8002")


# ── Tools list ────────────────────────────────────────────────────
@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="send_message",
            description="Send a message to a specific chat thread.",
            inputSchema={
                "type": "object",
                "properties": {
                    "thread_id": {"type": "string", "description": "The chat room/thread ID (e.g. '123')"},
                    "sender":    {"type": "string", "description": "Your name or identifier"},
                    "message":   {"type": "string", "description": "The message content to send"},
                },
                "required": ["thread_id", "sender", "message"],
            },
        ),
    ]


# ── Tool execution ────────────────────────────────────────────────
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            if name == "send_message":
                response = await client.post(
                    f"{ADMIN_BACKEND_URL}/send",
                    json={
                        "thread_id": arguments["thread_id"],
                        "sender":    arguments["sender"],
                        "message":   arguments["message"],
                    }
                )
                data = response.json()

                # ✅ /send only returns status and thread_id — no "data" key
                result = (
                    f"✅ Message sent!\n"
                    f"  Thread ID : {data.get('thread_id', 'unknown')}\n"
                    f"  Sender    : {arguments['sender']}\n"
                    f"  Message   : {arguments['message']}\n"
                    f"  Status    : {data.get('status', 'unknown')}\n"
                )
            else:
                result = f"Unknown tool: {name}"

    except httpx.ConnectError:
        result = "❌ Cannot connect to receiver app. Make sure port 8002 is running."
    except Exception as e:
        result = f"Error: {str(e)}"

    return [TextContent(type="text", text=result)]

# ── Run ───────────────────────────────────────────────────────────
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
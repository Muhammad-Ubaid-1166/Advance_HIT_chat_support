import asyncio
import json
import os
import httpx

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage

from src.auth.utils import decode_token
from src.chatbot import service as chatbot_service
from store.store import _reply_channel

chatbot_router = APIRouter()

ADMIN_BACKEND_URL = os.getenv("ADMIN_BACKEND_URL", "http://localhost:8002")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

active_ws: dict[str, WebSocket] = {}

# ─── disconnect_events: one per connected user ────────────────────────
# set ONLY when user disconnects — kills listener + watcher
disconnect_events: dict[str, asyncio.Event] = {}
async def is_admin_active(thread_id: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"{ADMIN_BACKEND_URL}/toggle/{thread_id}")
            return res.json().get("admin_active", False)
    except:
        return False
# ─────────────────────────────────────────────────────────────────────
# BACKGROUND TASK 1: Admin Reply Listener
# Starts immediately on connect
# Subscribes to Redis Pub/Sub
# Pushes admin messages to user the moment they arrive
# Only stops on disconnect — NOT on toggle change
# ─────────────────────────────────────────────────────────────────────
async def admin_reply_listener(user_uid: str, websocket: WebSocket, disconnect_event: asyncio.Event):
    import redis.asyncio as aioredis

    r = aioredis.Redis.from_url(REDIS_URL, decode_responses=True)
    pubsub = r.pubsub()
    channel = _reply_channel(user_uid)
    await pubsub.subscribe(channel)

    print(f"[LISTENER] Subscribed to {channel}")

    try:
        async for message in pubsub.listen():

            # only stop on disconnect
            if disconnect_event.is_set():
                print(f"[LISTENER] Disconnect detected — stopping for {user_uid}")
                break

            # skip subscription confirmation messages
            if message["type"] != "message":
                continue

            try:
                data = json.loads(message["data"])
                await websocket.send_text(json.dumps({
                    "type":    "message",
                    "sender":  "admin",
                    "message": data["message"],
                }))
                print(f"[LISTENER] ✅ Pushed to user {user_uid}: {data['message']}")
            except Exception as e:
                print(f"[LISTENER] WebSocket send error: {e}")
                break

    finally:
        await pubsub.unsubscribe(channel)
        await r.aclose()
        print(f"[LISTENER] Cleaned up for {user_uid}")
# ─────────────────────────────────────────────────────────────────────
# BACKGROUND TASK 2: Toggle Watcher
# Polls toggle every 2s
# Notifies user immediately when admin takes over or hands back
# ─────────────────────────────────────────────────────────────────────
async def toggle_watcher(user_uid: str, websocket: WebSocket, disconnect_event: asyncio.Event):
    last_state = False

    while not disconnect_event.is_set():
        try:
            current_state = await is_admin_active(user_uid)

            if current_state and not last_state:
                await websocket.send_text(json.dumps({
                    "type":    "status",
                    "message": "You are now connected to a live support agent.",
                }))
                print(f"[WATCHER] Admin ON for {user_uid}")

            elif not current_state and last_state:
                await websocket.send_text(json.dumps({
                    "type":    "status",
                    "message": "You are now connected to the AI assistant.",
                }))
                print(f"[WATCHER] Agent ON for {user_uid}")

            last_state = current_state

        except Exception as e:
            print(f"[WATCHER] Error: {e}")

        await asyncio.sleep(2)

    print(f"[WATCHER] Stopped for {user_uid}")
# ─── These endpoints are now no-ops — kept for compatibility ──────────
# Toggle no longer kills the listener (that was the bug)
@chatbot_router.post("/toggle-cancel/{user_uid}")
async def cancel_admin_wait(user_uid: str):
    # ✅ do nothing — listener must stay alive regardless of toggle state
    # listener only stops on disconnect
    return {"cancelled": False, "reason": "listener runs until disconnect"}
@chatbot_router.post("/toggle-cancel-all")
async def cancel_all_admin_waits():
    return {"cancelled": 0, "reason": "listeners run until disconnect"}
# ─── WebSocket ────────────────────────────────────────────────────────
@chatbot_router.websocket("/ws")
async def websocket_chat(websocket: WebSocket):

    await websocket.accept()

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return

    token_data = decode_token(token)
    if not token_data or token_data.get("refresh"):
        await websocket.close(code=1008, reason="Invalid or expired token")
        return

    user_uid = token_data["user"]["user_uid"]
    username = token_data["user"]["email"]

    active_ws[user_uid] = websocket
    print(f"[WS] {username} connected — uid: {user_uid}")

    # ✅ one event per connection — only set on disconnect
    disconnect_event = asyncio.Event()
    disconnect_events[user_uid] = disconnect_event

    # ✅ both tasks start immediately on connect
    listener_task = asyncio.create_task(
        admin_reply_listener(user_uid, websocket, disconnect_event)
    )
    watcher_task = asyncio.create_task(
        toggle_watcher(user_uid, websocket, disconnect_event)
    )

    async def cleanup():
        print(f"[WS] Cleaning up {user_uid}")
        disconnect_event.set()  # stops listener + watcher
        for task in [listener_task, watcher_task]:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        active_ws.pop(user_uid, None)
        disconnect_events.pop(user_uid, None)

    try:
        while True:
            raw          = await websocket.receive_text()
            user_message = raw.strip()

            if not user_message:
                continue

            print(f"[WS] Message from {username}: {user_message}")

            # ─── Admin mode ───────────────────────────────────────────
            # listener is always running — admin replies arrive automatically
            # no blocking wait needed here
            if await is_admin_active(user_uid):
                try:
                    async with httpx.AsyncClient(timeout=10) as client:
                        await client.post(
                            f"{ADMIN_BACKEND_URL}/send",
                            json={
                                "thread_id": user_uid,
                                "sender":    username,
                                "message":   user_message,
                            }
                        )
                except Exception as e:
                    print(f"[WS] forward error: {e}")

                await websocket.send_text(json.dumps({
                    "type":    "status",
                    "message": "Message delivered to support.",
                }))

            # ─── Agent mode ───────────────────────────────────────────
            else:
                if chatbot_service.graph is None:
                    await websocket.send_text(json.dumps({
                        "type":    "error",
                        "message": "Chatbot service not ready.",
                    }))
                    continue

                await websocket.send_text(json.dumps({
                    "type":    "status",
                    "message": "Agent is thinking...",
                }))

                try:
                    out = await chatbot_service.graph.ainvoke(
                        {
                            "messages":  [HumanMessage(content=user_message)],
                            "summary":   "",
                            "user_id":   user_uid,
                            "username":  username,
                            "thread_id": user_uid,
                        },
                        {"configurable": {"thread_id": user_uid}},
                    )

                    last_message = out["messages"][-1]

                    if isinstance(last_message.content, list):
                        reply = " ".join(
                            block["text"] for block in last_message.content
                            if isinstance(block, dict) and block.get("type") == "text"
                        )
                    else:
                        reply = last_message.content

                    await websocket.send_text(json.dumps({
                        "type":    "message",
                        "sender":  "agent",
                        "message": reply,
                    }))

                except Exception as e:
                    await websocket.send_text(json.dumps({
                        "type":    "error",
                        "message": f"Agent error: {str(e)}",
                    }))
                    continue

    except WebSocketDisconnect:
        print(f"[WS] {username} disconnected")
        await cleanup()
import os
import redis
import json
from datetime import datetime
from typing import List

# ─── Redis Connection ─────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def _key(thread_id: str) -> str:
    return f"chat:{thread_id}"

def _reply_channel(user_uid: str) -> str:
    """Channel admin publishes reply to — user WS listens here"""
    return f"chat:reply:{user_uid}"

def _incoming_channel(user_uid: str) -> str:
    """Channel user publishes message to — admin WS listens here"""
    return f"chat:incoming:{user_uid}"

def _toggle_key(thread_id: str) -> str:
    """Redis key for toggle state — persists across restarts"""
    return f"toggle:{thread_id}"

def _toggle_channel(thread_id: str) -> str:
    """Pub/Sub channel for toggle changes — replaces polling"""
    return f"toggle:change:{thread_id}"


# ─── Toggle state (Redis-backed) ──────────────────────────────────────
def get_toggle_state(thread_id: str) -> bool:
    """Get toggle state from Redis — survives server restarts"""
    return r.exists(_toggle_key(thread_id)) == 1

def set_toggle_state(thread_id: str, active: bool) -> bool:
    """
    Set toggle state in Redis and publish change to Pub/Sub.
    Returns the new state.
    """
    if active:
        r.set(_toggle_key(thread_id), "1")
    else:
        r.delete(_toggle_key(thread_id))

    # ✅ publish toggle change — both user watcher and admin WS receive this
    payload = json.dumps({
        "thread_id":    thread_id,
        "admin_active": active,
    })
    r.publish(_toggle_channel(thread_id), payload)
    return active


# ─── Save message ─────────────────────────────────────────────────────
def save_message(thread_id: str, sender: str, message: str, sender_type: str = "user") -> dict:
    entry = {
        "sender":      sender,
        "sender_type": sender_type,
        "message":     message,
        "timestamp":   datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    r.rpush(_key(thread_id), json.dumps(entry))
    return entry

# ─── Get all messages ─────────────────────────────────────────────────
def get_messages(thread_id: str) -> List[dict]:
    raw = r.lrange(_key(thread_id), 0, -1)
    return [json.loads(m) for m in raw]

# ─── Pub/Sub: user message ────────────────────────────────────────────
def publish_user_message(user_uid: str, message: str, sender: str):
    """User sends message — publish so admin WS receives it instantly"""
    payload = json.dumps({
        "sender":      sender,
        "sender_type": "user",
        "message":     message,
        "timestamp":   datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    })
    r.publish(_incoming_channel(user_uid), payload)

# ─── Pub/Sub: admin reply ─────────────────────────────────────────────
def publish_admin_reply(user_uid: str, message: str):
    """Admin sends reply — publish so user WS receives it instantly"""
    payload = json.dumps({
        "sender":      "admin",
        "sender_type": "admin",
        "message":     message,
        "timestamp":   datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    })
    r.publish(_reply_channel(user_uid), payload)
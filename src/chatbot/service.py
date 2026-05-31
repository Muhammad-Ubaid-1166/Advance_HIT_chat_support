import os

# ═══════════════════════════════════════════════════════════════════════
# BLAS threading guards (keep these — they help with other numpy ops)
# ═══════════════════════════════════════════════════════════════════════
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import io
import logging
import asyncio
from typing import List, Optional

import numpy as np
import requests
from supabase import create_client
from pypdf import PdfReader
from langchain_groq import ChatGroq
from langchain_cohere import CohereEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage,
    RemoveMessage,
    AnyMessage,
)
from langgraph.graph import MessagesState, StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_mcp_adapters.client import MultiServerMCPClient
from dotenv import load_dotenv

# Load from main .env file (consolidated for Railway deployment)
# In production, environment variables are set directly in Railway
load_dotenv()

# ─── Logging ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# ─── ENV Validation ───────────────────────────────────────────────────
def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(
            f"Missing required environment variable: {name}. "
            f"Please set it in your .env file or environment."
        )
    return value

GROQ_API_KEY   = _require_env("groq_api_key_3")
COHERE_API_KEY = _require_env("COHERE_API_KEY")
SUPABASE_URL   = _require_env("SUPABASE_URL")
SUPABASE_KEY   = _require_env("SUPABASE_KEY")

MCP_SERVER_PATH = os.getenv(
    "MCP_SERVER_PATH",
    os.path.join(os.path.dirname(__file__), "MCP_Server.py"),
)

COHERE_EMBED_MODEL = os.getenv("COHERE_EMBED_MODEL", "embed-v4.0")
USE_FAISS = os.getenv("USE_FAISS", "false").lower() == "true"

# ─── PDF filenames ────────────────────────────────────────────────────
PDF_FILES = ["document.pdf"]

# ─── LLM ──────────────────────────────────────────────────────────────
llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model="llama-3.3-70b-versatile",
    temperature=0.2,
)

# ─── Batched Cohere Embeddings ────────────────────────────────────────
class BatchedCohereEmbeddings(CohereEmbeddings):
    """Wraps CohereEmbeddings to stay under the 96-text API batch limit."""
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if len(texts) <= 48:
            return super().embed_documents(texts)
        all_embeddings: List[List[float]] = []
        batch_size = 48
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            all_embeddings.extend(super().embed_documents(batch))
            logger.info(f"[EMBED] batch {i // batch_size + 1} done")
        return all_embeddings

embeddings = BatchedCohereEmbeddings(
    cohere_api_key=COHERE_API_KEY,
    model=COHERE_EMBED_MODEL,
)

# ─── Pure-numpy Cosine Retriever (no FAISS, no hangs) ────────────────
class CosineRetriever:
    """
    Lightweight in-memory retriever using cosine similarity.
    - Zero C++ dependencies
    - Works inside Uvicorn --reload / fastapi dev
    - Faster than FAISS for < 500 chunks
    """
    def __init__(
        self,
        texts: List[str],
        embedded_vectors: List[List[float]],
        metadatas: List[dict],
        embedding_model,
        k: int = 5,
    ):
        self.texts = texts
        self.metadatas = metadatas
        self.embedding_model = embedding_model
        self.k = k

        self.vectors = np.array(embedded_vectors, dtype=np.float32)
        norms = np.linalg.norm(self.vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.normed = self.vectors / norms

    def invoke(self, query: str) -> List[Document]:
        q_vec = np.array(self.embedding_model.embed_query(query), dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        scores = self.normed @ q_vec
        top_k_idx = np.argsort(scores)[-self.k :][::-1]

        docs: List[Document] = []
        for idx in top_k_idx:
            docs.append(
                Document(
                    page_content=self.texts[idx],
                    metadata=self.metadatas[idx],
                )
            )
        return docs


# ─── State ────────────────────────────────────────────────────────────
class ChatState(MessagesState):
    summary: str
    user_id: str
    username: str
    thread_id: str

# ─── Globals ──────────────────────────────────────────────────────────
graph = None
llm_with_tools = None
retriever = None
mcp_client: Optional[MultiServerMCPClient] = None


# ─── PDF Loader ───────────────────────────────────────────────────────
def load_pdfs_from_supabase() -> List[Document]:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    all_docs: List[Document] = []

    for filename in PDF_FILES:
        try:
            logger.info(f"[PDF] Fetching {filename}...")
            pdf_bytes = None

            try:
                pdf_bytes = supabase.storage.from_("pdfs").download(filename)
                logger.info("[PDF] Authenticated download OK")
            except Exception:
                url = supabase.storage.from_("pdfs").get_public_url(filename)
                resp = requests.get(url, timeout=30)
                resp.raise_for_status()
                pdf_bytes = resp.content

            reader = PdfReader(io.BytesIO(pdf_bytes))
            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                if text.strip():
                    all_docs.append(
                        Document(
                            page_content=text,
                            metadata={
                                "source": filename,
                                "page": page_num,
                                "total_pages": len(reader.pages),
                            },
                        )
                    )
            logger.info(f"[PDF] Loaded {len(reader.pages)} pages from {filename} ✅")
        except Exception as e:
            logger.error(f"[PDF] Failed {filename}: {e}")

    return all_docs


# ─── Build Retriever ──────────────────────────────────────────────────
def build_retriever():
    logger.info("[RETRIEVER] Loading PDFs from Supabase...")
    docs = load_pdfs_from_supabase()
    if not docs:
        logger.warning("[RETRIEVER] No documents loaded.")
        return None

    chunk_size = 800 if COHERE_EMBED_MODEL.startswith("embed-v4") else 400
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    logger.info(f"[RETRIEVER] {len(chunks)} chunks from {len(docs)} pages")

    if not chunks:
        return None

    texts = [c.page_content for c in chunks]
    metadatas = [c.metadata for c in chunks]

    logger.info("[RETRIEVER] Embedding chunks with Cohere...")
    embedded_vectors = embeddings.embed_documents(texts)
    logger.info("[RETRIEVER] Embeddings received ✅")

    if USE_FAISS:
        logger.info("[RETRIEVER] Building FAISS index...")
        from langchain_community.vectorstores import FAISS
        vector_store = FAISS.from_documents(chunks, embeddings)
        ret = vector_store.as_retriever(search_kwargs={"k": 5})
        logger.info("[RETRIEVER] FAISS ready ✅")
        return ret

    logger.info("[RETRIEVER] Building CosineRetriever (hang-proof) ✅")
    return CosineRetriever(
        texts=texts,
        embedded_vectors=embedded_vectors,
        metadatas=metadatas,
        embedding_model=embeddings,
        k=5,
    )


# ─── Node: chat ───────────────────────────────────────────────────────
def chat_node(state: ChatState):
    messages: List[AnyMessage] = []

    # ── Retrieve relevant context from PDFs ───────────────────────────
    pdf_context = ""
    if retriever:
        try:
            last_human = next(
                (
                    m.content
                    for m in reversed(state["messages"])
                    if isinstance(m, HumanMessage)
                ),
                None,
            )
            if last_human:
                relevant_docs = retriever.invoke(last_human)
                if relevant_docs:
                    pdf_context = "\n\n---\n\n".join(
                        [
                            f"[Source: {d.metadata.get('source', '?')} | "
                            f"Page {d.metadata.get('page', '?')}]\n{d.page_content}"
                            for d in relevant_docs
                        ]
                    )
                    logger.info(f"[RETRIEVER] {len(relevant_docs)} chunks retrieved")
        except Exception as e:
            logger.error(f"[RETRIEVER] Error: {e}")

    # ── System Prompt ─────────────────────────────────────────────────
    if pdf_context:
        context_section = (
            "## University Knowledge Base (extracted from official documents):\n"
            f"{pdf_context}\n\n"
            "The content above comes directly from official HIT university documents. "
            "Use it as your ONLY source of truth when answering questions."
        )
    else:
        context_section = (
            "## University Knowledge Base:\n"
            "No relevant content was found in the documents for this question."
        )

    system_content = (
        "You are an official AI assistant for NovaTech Solutions Inc.\n"
        "Your job is to answer employee and stakeholder questions using ONLY the official company policy documents provided below.\n\n"

        f"{context_section}\n\n"

        "## How to respond:\n\n"

        "CASE 1 — The answer EXISTS in the knowledge base above:\n"
        "  → Answer the question clearly and concisely based on the document content.\n"
        "  → Do NOT mention that you are reading from a document or PDF.\n"
        "  → Sound natural and helpful, like a knowledgeable HR or company staff member.\n\n"

        "CASE 2 — The answer is NOT in the knowledge base above:\n"
        "  → Do NOT guess, assume, or make up any information.\n"
        "  → IMMEDIATELY call the `send_message` tool with the following data:\n"
        f"       thread_id : {state['thread_id']}\n"
        f"       sender    : {state['username']}\n"
        f"       user_id   : {state['user_id']}\n"
        "       message   : the user's exact question, word for word\n"
        "  → After calling the tool, say nothing else — the after_tool node handles the user reply.\n\n"

        "## Strict Rules:\n"
        "- NEVER reveal that you are using a document, PDF, or knowledge base.\n"
        "- NEVER ask the user to provide thread_id or sender — use the values above silently.\n"
        "- NEVER answer from general knowledge — only from the documents above.\n"
        "- NEVER skip calling the tool when the answer is not in the documents.\n"
        "- Keep answers short, clear, and professional.\n"
        "- For HR-related queries not covered, direct users to: hr@novatechsolutions.com"
    )
    messages.append(SystemMessage(content=system_content))

    if state.get("summary"):
        messages.append(
            SystemMessage(
                content=f"Conversation summary so far:\n{state['summary']}"
            )
        )

    messages.extend(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


# ─── Node: summarize ──────────────────────────────────────────────────
def summarize_conversation(state: ChatState):
    existing_summary = state.get("summary", "")
    prompt = (
        f"Existing summary:\n{existing_summary}\n\nExtend concisely."
        if existing_summary
        else "Summarize the conversation concisely."
    )
    msgs = list(state["messages"]) + [HumanMessage(content=prompt)]
    response = llm_with_tools.invoke(msgs)

    to_delete = [
        RemoveMessage(id=m.id)
        for m in state["messages"][:-2]
        if hasattr(m, "id") and m.id
    ]
    return {"summary": response.content, "messages": to_delete}


# ─── Node: after_tool ─────────────────────────────────────────────────
def after_tool_node(state: ChatState):
    to_delete: List[RemoveMessage] = []
    for m in state["messages"]:
        if isinstance(m, ToolMessage) and getattr(m, "id", None):
            to_delete.append(RemoveMessage(id=m.id))
        if (
            isinstance(m, AIMessage)
            and getattr(m, "tool_calls", None)
            and getattr(m, "id", None)
        ):
            to_delete.append(RemoveMessage(id=m.id))

    friendly = AIMessage(
        content="✅ Your question has been sent to the admin. They will respond soon!"
    )
    return {"messages": to_delete + [friendly]}


# ─── Condition ────────────────────────────────────────────────────────
def should_summarize(state: ChatState) -> str:
    chat_msgs = [m for m in state["messages"] if not isinstance(m, SystemMessage)]
    return "summarize" if len(chat_msgs) > 8 else "__end__"


# ─── Init graph ───────────────────────────────────────────────────────
async def init_graph():
    global graph, llm_with_tools, retriever, mcp_client

    loop = asyncio.get_event_loop()
    retriever = await loop.run_in_executor(None, build_retriever)

    if not os.path.exists(MCP_SERVER_PATH):
        raise FileNotFoundError(f"MCP server not found: {MCP_SERVER_PATH}")

    mcp_client = MultiServerMCPClient(
        {
            "chat-connector": {
                "command": "python",
                "args": [MCP_SERVER_PATH],
                "transport": "stdio",
            }
        }
    )

    tools = await mcp_client.get_tools()
    logger.info(f"[MCP] Loaded {len(tools)} tools ✅")

    llm_with_tools = llm.bind_tools(tools)
    tool_node = ToolNode(tools)

    builder = StateGraph(ChatState)
    builder.add_node("chat", chat_node)
    builder.add_node("tools", tool_node)
    builder.add_node("after_tool", after_tool_node)
    builder.add_node("summarize", summarize_conversation)

    builder.add_edge(START, "chat")
    builder.add_conditional_edges("chat", tools_condition, {"tools": "tools", "__end__": END})
    builder.add_edge("tools", "after_tool")
    builder.add_conditional_edges("after_tool", should_summarize, {"summarize": "summarize", "__end__": END})
    builder.add_edge("summarize", END)

    graph = builder.compile(checkpointer=MemorySaver())
    logger.info("[GRAPH] LangGraph initialized ✅")
    return graph


async def close_graph():
    global mcp_client
    if mcp_client:
        logger.info("[MCP] Cleaning up...")
        mcp_client = None
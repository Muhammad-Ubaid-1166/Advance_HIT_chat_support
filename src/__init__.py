from fastapi import FastAPI
from contextlib import asynccontextmanager
from src.auth.routes import auth_router
from src.chatbot.routes import chatbot_router
from src.chatbot.service import init_graph
from .errors import register_all_errors
from .middleware import register_middleware

version = "v1"
version_prefix = f"/api/{version}"

description = """
A REST API for a book review web service.
This REST API is able to;
- Create Read Update And delete books
- Add reviews to books
- Add tags to Books e.t.c.
"""

# ✅ lifespan defined before app
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_graph()  # runs once at startup
    yield

# ✅ single app with lifespan passed in
app = FastAPI(
    title="Bookly",
    description=description,
    version=version,
    lifespan=lifespan,                          # ✅ attached here
    openapi_url=f"{version_prefix}/openapi.json",
    docs_url=f"{version_prefix}/docs",
    redoc_url=f"{version_prefix}/redoc"
)

register_all_errors(app)
register_middleware(app)

app.include_router(auth_router, prefix=f"{version_prefix}/auth", tags=["auth"])
app.include_router(chatbot_router, prefix=f"{version_prefix}/chatbot", tags=["Chatbot"])
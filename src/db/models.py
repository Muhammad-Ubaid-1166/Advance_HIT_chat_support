# models.py
from sqlmodel import SQLModel, Field, Column, Relationship
from sqlalchemy.dialects import postgresql as pg
from datetime import datetime
from typing import Optional, List
import uuid


# models.py
class User(SQLModel, table=True):
    __tablename__ = "users"
    
    uid: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, primary_key=True, default=uuid.uuid4)
    )
    username: str
    email: str
    first_name: str
    last_name: str
    role: str = Field(
        sa_column=Column(pg.VARCHAR, nullable=False, server_default="user")
    )
    is_verified: bool = Field(default=False)
    password_hash: str = Field(
        sa_column=Column(pg.VARCHAR, nullable=False), exclude=True
    )
    created_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, default=datetime.utcnow)
    )
    updated_at: datetime = Field(  # ✅ Changed from update_at
        sa_column=Column(pg.TIMESTAMP, default=datetime.utcnow)
    )
    
    # Relationships
    todos: List["Todo"] = Relationship(
        back_populates="user", 
        sa_relationship_kwargs={"lazy": "selectin"}
    )
    
    def __repr__(self):
        return f"<User {self.username}>"

class Todo(SQLModel, table=True):
    __tablename__ = "todos"
    
    uid: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, primary_key=True, default=uuid.uuid4)
    )
    title: str = Field(max_length=255)
    detail: Optional[str] = Field(default=None)
    completed: bool = Field(default=False)
    due_date: Optional[datetime] = Field(default=None)
    
    user_uid: Optional[uuid.UUID] = Field(default=None, foreign_key="users.uid")
    
    created_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, default=datetime.utcnow)
    )
    updated_at: datetime = Field(  # ✅ Changed from update_at
        sa_column=Column(pg.TIMESTAMP, default=datetime.utcnow)
    )
    
    user: Optional[User] = Relationship(back_populates="todos")
    
    def __repr__(self):
        return f"<Todo {self.title}>"
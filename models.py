from sqlalchemy import Column, Integer, String, Boolean, Date
from database import Base

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    last_completed_date = Column(Date, nullable=True)
    streak = Column(Integer, default=0)
    paused = Column(Boolean, default=False)

class Task(Base):
    __tablename__ = 'tasks'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    description = Column(String)
    completed = Column(Boolean, default=False)

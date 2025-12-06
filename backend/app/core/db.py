from typing import Generator
from app.models.database import *
from sqlmodel import SQLModel, Session, create_engine

from app.core.config import settings


engine = create_engine(settings.DATABASE_URL,
                       connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine,checkfirst=True)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

def create_db_session() -> Session:
    """
    创建一个新的数据库会话实例。
    调用者需要使用 `with` 语句来确保会话被正确关闭。
    """
    return Session(engine)

create_db_and_tables()
from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import event
from sqlalchemy.orm import mapper, RelationshipProperty

from app.core.config import settings
from app.models.database import *  # 确保所有模型都被导入

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# 全局设置所有关系的默认加载策略
@event.listens_for(mapper, "mapper_configured")
def _set_default_lazy_loading(mapper_, class_):
    """为所有关系设置默认的加载策略"""
    # 只处理SQLModel表模型
    if hasattr(class_, '__tablename__') and hasattr(class_, '__table__'):
        for prop in mapper_.iterate_properties:
            # 只处理关系属性
            if isinstance(prop, RelationshipProperty):
                # 只在未明确设置lazy策略时修改
                if prop.lazy in ('select', True):  # SQLModel默认是'select'
                    # 根据关系类型设置不同的默认策略
                    if prop.uselist:  # 一对多关系
                        prop.lazy = 'selectin'
                    else:  # 多对一或一对一关系
                        prop.lazy = 'joined'

def create_db_and_tables():
    """创建数据库表"""
    SQLModel.metadata.create_all(engine, checkfirst=True)

def get_session() -> Generator[Session, None, None]:
    """获取数据库会话（依赖注入用）"""
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
    """创建新的数据库会话实例"""
    return Session(engine)

# 初始化数据库
create_db_and_tables()

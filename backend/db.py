"""
db.py
Small connection-pool helper around PyMySQL so the rest of the app
never has to think about opening/closing connections manually.
"""
import os
import pymysql
import pymysql.cursors
from dbutils.pooled_db import PooledDB
from dotenv import load_dotenv

load_dotenv()

_pool = PooledDB(
    creator=pymysql,
    maxconnections=10,
    mincached=2,
    host=os.getenv("DB_HOST", "127.0.0.1"),
    port=int(os.getenv("DB_PORT", "3306")),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", ""),
    database=os.getenv("DB_NAME", "expense_tracker"),
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=True,
)


def get_connection():
    """Grab a pooled connection. Caller is responsible for closing it
    (which returns it to the pool rather than actually disconnecting)."""
    return _pool.connection()

"""
app.py — Personal Expense Tracker API (Flask)

Endpoints:
    POST /api/transactions       Create a transaction
    GET  /api/transactions       List recent transactions (paginated, filterable)
    GET  /api/summary            Aggregate spend by category (for charts)
    GET  /api/categories         List categories (used to populate the form dropdown)
    GET  /api/health             Simple healthcheck

Run:
    python app.py
"""
import os
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymysql.err import IntegrityError, MySQLError

from db import get_connection

app = Flask(__name__)

# Allow the Next.js dev server (and any origin you configure) to call this API.
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": os.getenv("CORS_ORIGINS", "http://localhost:3000"),
            "methods": ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
    supports_credentials=True,
)

# For a real multi-user app this would come from an auth/session layer.
# Kept simple here so the frontend has something concrete to call.
DEFAULT_USER_ID = int(os.getenv("DEFAULT_USER_ID", "1"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def error_response(message, status=400):
    return jsonify({"error": message}), status


def parse_date(value):
    """Accepts 'YYYY-MM-DD' and returns a date, or None if invalid/blank."""
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def serialize_transaction(row):
    """Convert DB row values (Decimal/date) into JSON-friendly types."""
    out = dict(row)
    if isinstance(out.get("amount"), Decimal):
        out["amount"] = float(out["amount"])
    for key in ("transaction_date", "created_at", "updated_at"):
        if isinstance(out.get(key), (date, datetime)):
            out[key] = out[key].isoformat()
    return out


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Categories  (used by the frontend to populate the dropdown)
# ---------------------------------------------------------------------------
@app.get("/api/categories")
def list_categories():
    user_id = request.args.get("user_id", DEFAULT_USER_ID, type=int)
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT category_id, name, type, icon, color_hex
                FROM categories
                WHERE user_id IS NULL OR user_id = %s
                ORDER BY type, name
                """,
                (user_id,),
            )
            rows = cur.fetchall()
        return jsonify(rows)
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# POST /api/transactions — create a transaction
# ---------------------------------------------------------------------------
@app.post("/api/transactions")
def create_transaction():
    payload = request.get_json(silent=True) or {}

    user_id = payload.get("user_id", DEFAULT_USER_ID)
    category_id = payload.get("category_id")
    amount_raw = payload.get("amount")
    transaction_date = parse_date(payload.get("transaction_date"))
    description = (payload.get("description") or "").strip() or None
    cost_type = payload.get("cost_type", "variable")
    transaction_type = payload.get("transaction_type", "expense")

    # --- validation -------------------------------------------------------
    if category_id is None:
        return error_response("category_id is required")

    try:
        amount = Decimal(str(amount_raw))
        if amount < 0:
            raise InvalidOperation
    except (InvalidOperation, TypeError):
        return error_response("amount must be a non-negative number")

    if transaction_date is None:
        return error_response("transaction_date is required and must be YYYY-MM-DD")

    if cost_type not in ("fixed", "variable"):
        return error_response("cost_type must be 'fixed' or 'variable'")

    if transaction_type not in ("expense", "income"):
        return error_response("transaction_type must be 'expense' or 'income'")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO transactions
                    (user_id, category_id, amount, transaction_date,
                     description, cost_type, transaction_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    category_id,
                    amount,
                    transaction_date,
                    description,
                    cost_type,
                    transaction_type,
                ),
            )
            new_id = cur.lastrowid

            cur.execute(
                """
                SELECT t.transaction_id, t.amount, t.transaction_date, t.description,
                       t.cost_type, t.transaction_type, t.created_at,
                       c.category_id, c.name AS category_name, c.color_hex
                FROM transactions t
                JOIN categories c ON c.category_id = t.category_id
                WHERE t.transaction_id = %s
                """,
                (new_id,),
            )
            row = cur.fetchone()
        return jsonify(serialize_transaction(row)), 201
    except IntegrityError as e:
        return error_response(f"Invalid category_id or user_id: {e}", 400)
    except MySQLError as e:
        return error_response(f"Database error: {e}", 500)
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# GET /api/transactions — recent transaction history
# ---------------------------------------------------------------------------
@app.get("/api/transactions")
def list_transactions():
    user_id = request.args.get("user_id", DEFAULT_USER_ID, type=int)
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)
    cost_type = request.args.get("cost_type")  # optional filter: fixed | variable
    category_id = request.args.get("category_id", type=int)

    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    clauses = ["t.user_id = %s"]
    params = [user_id]

    if cost_type in ("fixed", "variable"):
        clauses.append("t.cost_type = %s")
        params.append(cost_type)

    if category_id:
        clauses.append("t.category_id = %s")
        params.append(category_id)

    where_sql = " AND ".join(clauses)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT t.transaction_id, t.amount, t.transaction_date, t.description,
                       t.cost_type, t.transaction_type, t.created_at,
                       c.category_id, c.name AS category_name, c.color_hex
                FROM transactions t
                JOIN categories c ON c.category_id = t.category_id
                WHERE {where_sql}
                ORDER BY t.transaction_date DESC, t.transaction_id DESC
                LIMIT %s OFFSET %s
                """,
                (*params, limit, offset),
            )
            rows = cur.fetchall()

            cur.execute(f"SELECT COUNT(*) AS total FROM transactions t WHERE {where_sql}", params)
            total = cur.fetchone()["total"]

        return jsonify(
            {
                "items": [serialize_transaction(r) for r in rows],
                "total": total,
                "limit": limit,
                "offset": offset,
            }
        )
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# GET /api/summary — aggregate spend by category, for charts
# ---------------------------------------------------------------------------
@app.get("/api/summary")
def summary():
    user_id = request.args.get("user_id", DEFAULT_USER_ID, type=int)
    start = parse_date(request.args.get("start"))
    end = parse_date(request.args.get("end"))
    transaction_type = request.args.get("transaction_type", "expense")

    clauses = ["t.user_id = %s", "t.transaction_type = %s"]
    params = [user_id, transaction_type]

    if start:
        clauses.append("t.transaction_date >= %s")
        params.append(start)
    if end:
        clauses.append("t.transaction_date <= %s")
        params.append(end)

    where_sql = " AND ".join(clauses)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Spend by category (pie chart data)
            cur.execute(
                f"""
                SELECT c.category_id, c.name AS category_name, c.color_hex,
                       SUM(t.amount) AS total_amount,
                       COUNT(*) AS transaction_count
                FROM transactions t
                JOIN categories c ON c.category_id = t.category_id
                WHERE {where_sql}
                GROUP BY c.category_id, c.name, c.color_hex
                ORDER BY total_amount DESC
                """,
                params,
            )
            by_category = cur.fetchall()

            # Fixed vs variable breakdown
            cur.execute(
                f"""
                SELECT t.cost_type, SUM(t.amount) AS total_amount
                FROM transactions t
                WHERE {where_sql}
                GROUP BY t.cost_type
                """,
                params,
            )
            by_cost_type = cur.fetchall()

            # Overall total
            cur.execute(
                f"SELECT COALESCE(SUM(t.amount), 0) AS grand_total FROM transactions t WHERE {where_sql}",
                params,
            )
            grand_total = cur.fetchone()["grand_total"]

        def clean(rows):
            out = []
            for r in rows:
                r = dict(r)
                if isinstance(r.get("total_amount"), Decimal):
                    r["total_amount"] = float(r["total_amount"])
                out.append(r)
            return out

        return jsonify(
            {
                "by_category": clean(by_category),
                "by_cost_type": clean(by_cost_type),
                "grand_total": float(grand_total),
            }
        )
    finally:
        conn.close()

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE', 'OPTIONS'])
def delete_transaction(transaction_id):
    if request.method == 'OPTIONS':
        return ('', 204)

    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Check if transaction exists
        cursor.execute("SELECT transaction_id FROM transactions WHERE transaction_id = %s", (transaction_id,))
        record = cursor.fetchone()

        if not record:
            return jsonify({"error": f"Transaction {transaction_id} not found"}), 404

        # Delete transaction (autocommit is already enabled in the connection pool)
        cursor.execute("DELETE FROM transactions WHERE transaction_id = %s", (transaction_id,))

        return jsonify({
            "message": "Transaction deleted successfully",
            "transaction_id": transaction_id
        }), 200

    except Exception as e:
        print("Delete error:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    app.run(debug=True, port=int(os.getenv("PORT", "5000")))

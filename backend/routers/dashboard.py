from fastapi import APIRouter, Depends
from ..core.db import supabase as sb
from ..schemas.user import User
from ..dependencies import check_role
from datetime import datetime
from dateutil.relativedelta import relativedelta
from collections import defaultdict

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(duration: str = "monthly", user: User = Depends(check_role(["admin"]))):
    users_resp = sb.table("users").select("*", count="exact").limit(1).execute()
    products_resp = sb.table("Products").select("*", count="exact").limit(1).execute()
    categories_resp = sb.table("category").select("*", count="exact").limit(1).execute()
    orders_resp = sb.table("orders").select("*", count="exact").limit(1).execute()


    completed_orders = sb.table("orders").select("total_amount, created_at").eq("status", "COMPLETED").order("created_at", desc=False).execute()
    total_revenue = sum(order.get("total_amount", 0) for order in completed_orders.data) if completed_orders.data else 0

    monthly_data = defaultdict(lambda: {"orders": 0, "revenue": 0})
    
    if duration == "day":
        start_date = datetime.utcnow() - relativedelta(days=30)
        time_format = "%b %d"
        labels = [(datetime.utcnow() - relativedelta(days=i)).strftime(time_format) for i in range(29, -1, -1)]
    elif duration == "yearly":
        start_date = datetime.utcnow() - relativedelta(years=5)
        time_format = "%Y"
        labels = [(datetime.utcnow() - relativedelta(years=i)).strftime(time_format) for i in range(4, -1, -1)]
    else:
        start_date = datetime.utcnow() - relativedelta(months=12)
        time_format = "%b %Y"
        labels = [(datetime.utcnow() - relativedelta(months=i)).strftime(time_format) for i in range(11, -1, -1)]
        
    all_orders_data = sb.table("orders").select("created_at, total_amount, status").gte("created_at", start_date.isoformat()).execute()
    
    for order in all_orders_data.data:
        try:
            created_at_dt = datetime.fromisoformat(order["created_at"].replace("Z", "+00:00"))
            month_key = created_at_dt.strftime(time_format) 
            
            monthly_data[month_key]["orders"] += 1
            if order.get("status") == "COMPLETED":
                monthly_data[month_key]["revenue"] += order.get("total_amount", 0)
        except Exception:
            pass
            
    trends = [{"label": label, "orders": monthly_data[label]["orders"], "revenue": monthly_data[label]["revenue"]} for label in labels]

    transactions_resp = sb.table("transactions").select("*").order("created_at", desc=True).limit(10).execute()
    recent_transactions = transactions_resp.data if transactions_resp.data else []


    orders_res = sb.table("orders").select("total_amount, user_id").eq("status", "COMPLETED").execute()
    customer_spend = defaultdict(float)
    for order in orders_res.data:
        uid = order.get("user_id")
        if uid:
            customer_spend[uid] += float(order.get("total_amount", 0))

    top_uids = sorted(customer_spend.keys(), key=lambda k: customer_spend[k], reverse=True)[:5]
    top_customers = []
    if top_uids:
        users_res = sb.table("users").select("id, fullname, email, image").in_("id", top_uids).execute()
        user_map = {u["id"]: u for u in users_res.data}
        for uid in top_uids:
            if uid in user_map:
                u = user_map[uid]
                u["total_spent"] = customer_spend[uid]
                top_customers.append(u)

    return {
        "status": "success",
        "data": {
            "users": users_resp.count if hasattr(users_resp, 'count') else 0,
            "products": products_resp.count if hasattr(products_resp, 'count') else 0,
            "categories": categories_resp.count if hasattr(categories_resp, 'count') else 0,
            "orders": orders_resp.count if hasattr(orders_resp, 'count') else 0,
            "revenue": total_revenue,
            "monthlyTrends": trends,
            "recentTransactions": recent_transactions,
            "topCustomers": top_customers
        }
    }

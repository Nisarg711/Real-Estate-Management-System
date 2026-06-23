import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request) {
    const {session,error}=await requireAuth();
    if(error)
    {
        return error;
    }
    try {
    const result = await pool.query(
      `SELECT 
         a.user_id,
         a.property_id,
         a.issue_date::TEXT,
         a.issue_time,
         a.visit_date::TEXT,
         a.visit_time,
         a.status,
         p.title,
         p.city,
         p.state,
         p.local_address
       FROM project.appointment a
       JOIN project.property p ON a.property_id = p.apn
       WHERE a.user_id = $1
       ORDER BY a.visit_date ASC, a.visit_time ASC`,
      [session.user.id]
    );
    console.log("Fetched Result: ",result.rows)
    return NextResponse.json({ appointments: result.rows });
}
catch(err)
{
     console.error("Appointments fetch error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
}

}
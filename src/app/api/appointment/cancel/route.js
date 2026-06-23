import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(request) {
  try {
    const { session, error } = await requireAuth();
    if (error) {
      return error;
    }

    if (!session.user?.id) {
      return NextResponse.json(
        { error: "Authenticated user ID is unavailable" },
        { status: 401 }
      );
    }
    const userid=session.user.id;
    const {apn,Issue_date,Issue_time}=await request.json();
    console.log("user Trying to cancel Appointment for: ",userid," ",apn, Issue_date,Issue_time);
    const query=`DELETE from project.appointment as a where a.user_id=$1 and a.issue_date=$2 and a.issue_time=$3`;
    const res=await pool.query(query,[userid,Issue_date,Issue_time])
    console.log("Deletion REsult: ",res)
    return NextResponse.json(
      {
        message: res
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Appointment error:", error);
    return NextResponse.json(
      { error: "Unable to cancel appointment" },
      { status: 500 }
    );
  }
}

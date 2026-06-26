import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
export async function GET() {
    const {session,error}=await requireAuth();
     if(error)
    {
        return error;
    }
    try{
        const response = await fetch(
        "https://api.countrystatecity.in/v1/countries/IN/states",
    {
      headers: {
        "X-CSCAPI-KEY": process.env.CSC_API_KEY,
      },
    }
  );
  console.log("Response is: ",response)
  const data = await response.json();
  if (!response.ok) {
  return NextResponse.json(
    {
      error: data?.message || "Failed to fetch states",
    },
    { status: response.status }
  );
}

return NextResponse.json(
  { message: data },
  { status: 200 }
);
    }
    catch(err)
    {
      return NextResponse.json(
      { error: "Unable to cancel appointment" },
      { status: 500 }
    );
    }

}
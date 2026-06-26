import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request) {
    const {session,error}=await requireAuth();
    if(error)
    {
        return error;
    }
    try{
            const { searchParams } = new URL(request.url);
            const query = searchParams.get("query");
            if(!query || query.length < 2){
                return NextResponse.json(
                    {suggestions:[]},
                    {status:200});
            }
            const query1=`SELECT apn, title, city, state
                        FROM project.property
                        WHERE status = 'Available' AND title ILIKE $1
                        LIMIT 5`
            const query2=`SELECT DISTINCT city, state
                         FROM project.property
                         WHERE status = 'Available' AND city ILIKE $1
                         LIMIT 5`
            
            const res1=await pool.query(query1,[`%${query}%`]);
            
            const res2=await pool.query(query2,[`%${query}%`]);

            const propertyResults = res1.rows.map((row) => ({
            type: "property",
            label: row.title,
            subtitle: `${row.city}, ${row.state}`,
            apn: row.apn,
            }));

            const cityResults = res2.rows.map((row) => ({
            type: "city",
            label: row.city,
            subtitle: row.state,
            }));
            const result = propertyResults.concat(cityResults);
            console.log(result)
             return NextResponse.json(
                    {suggestions:result},
                    {status:200});
            
        // TODO: extract the search query from URL params (hint: same pattern as 
        // your /api/fetch/properties apn extraction — searchParams.get(...))
  
        // TODO: if query is missing or shorter than 2 characters, 
        // return an empty suggestions array immediately (status 200, not an error —
        // this isn't a bad request, just "nothing to search yet")
  
        // TODO: query 1 — property title matches
  
        // TODO: query 2 — distinct city matches
  
        // TODO: combine both into one array, each item tagged with a "type" field
  
  // TODO: return NextResponse.json({ suggestions: [...] })
    }
    catch(err)
    {
        return NextResponse.json({error:"Error in Suggestions API"}, {status:500})
    }
}
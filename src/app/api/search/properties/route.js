import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await request.json();
    const { locations } = body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({ properties: [] }, { status: 200 });
    }

    const conditions = [];
const params = [];

locations.forEach((loc, idx) => {
  const cityParam = idx * 2 + 1;
  const stateParam = idx * 2 + 2;
  conditions.push(`(p.city ILIKE $${cityParam} AND p.state ILIKE $${stateParam})`);
  params.push(`%${loc.city}%`, `%${loc.state}%`);
});

const whereClause = conditions.join(' OR ');

const query = `
  SELECT 
    p.apn, p.title, p.city, p.state, p.district,
    p.local_address, p.area, p.type, p.status, 
    p.available_for, p.built_year,
    r.monthly_rent, s.price,
    pi.image_url
  FROM project.property p
  LEFT JOIN project.rent r ON p.apn = r.property_id AND p.owner_id = r.owner_id
  LEFT JOIN project.sell s ON p.apn = s.property_id AND p.owner_id = s.owner_id
  LEFT JOIN project.property_image pi ON p.apn = pi.property_id
  WHERE p.status = 'Available' AND (${whereClause})
  ORDER BY p.apn ASC
  LIMIT 30
`;

    const result = await pool.query(query, params);
    console.log("result: ",result)
    // Deduplicate by apn since the image JOIN can produce multiple rows per property
    const propertiesMap = new Map();
    result.rows.forEach((row) => {
      if (!propertiesMap.has(row.apn)) {
        propertiesMap.set(row.apn, { ...row, images: [] });
      }
      if (row.image_url) {
        propertiesMap.get(row.apn).images.push(row.image_url);
      }
    });

    return NextResponse.json({ properties: Array.from(propertiesMap.values()) }, { status: 200 });

  } catch (err) {
    console.error("Search properties error:", err.message);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
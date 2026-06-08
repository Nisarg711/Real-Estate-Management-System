import {NextResponse} from "next/server";
import pool from "@/lib/db";
import {requireAuth} from "@/lib/api-helpers";

export async function POST(request)
{
    const { session, error } = await requireAuth();
    if (error) {
        return error;
    }
    try{
      //  console.log("Received request to fetch properties with query: ", request.url)
       const apn = request.nextUrl.searchParams.get("apn");
       const body = await request.json();
       console.log("Request body: ", body)
       
       // Helper function to format property data
       const formatProperty = (row) => ({
          apn: row.apn,
          builtYear: row.built_year,
          status: row.status,
          mapUrl: row.map_url,
          area: row.area,
          state: row.state,
          city: row.city,
          district: row.district,
          localAddress: row.local_address,
          pincode: row.pincode,
          neighborhoodInfo: row.neighborhood_info,
          title: row.title,
          availableFor: row.available_for,
          type: row.type,
          tourUrl: row.tour_url,
          societyRegNo: row.society_reg_no,
          societyName: row.society_name,
          rent: row.monthly_rent ? {
             monthlyRent: row.monthly_rent,
             securityDeposit: row.security_deposit
          } : null,
          sell: row.price ? {
             price: row.price
          } : null,
          owner: row.owner_id ? {
             userId: row.owner_id,
             name: row.owner_name,
             contact: row.owner_contact,
             email: row.owner_email
          } : null,
          agent: row.agent_lc_no ? {
             licenseNo: row.agent_lc_no,
             name: row.agent_name,
             contact: row.agent_contact,
             email: row.agent_email
          } : null,
          images: [],
          amenities: []
       });

       // If APN is provided, fetch single property by APN
       if (apn) {
          console.log("Fetching property with APN: ", apn);
          
          const query = `
             SELECT 
               p.apn,
               p.built_year,
               p.status,
               p.map_url,
               p.area,
               p.state,
               p.city,
               p.district,
               p.local_address,
               p.pincode,
               p.neighborhood_info,
               p.title,
               p.available_for,
               p.type,
               p.tour_url,
               p.society_reg_no,
               s_info.society_name,
               r.monthly_rent,
               r.security_deposit,
               se.price,
               p.owner_id,
               u_owner.name as owner_name,
               u_owner.contact_no as owner_contact,
               u_owner.email as owner_email,
               a.licence_no as agent_lc_no,
               u_agent.name as agent_name,
               u_agent.contact_no as agent_contact,
               u_agent.email as agent_email,
               pi.image_url,
               pi.description as image_description,
               am.amenity_name
             FROM project.property p
             LEFT JOIN project.rent r 
               ON p.apn = r.property_id AND p.owner_id = r.owner_id
             LEFT JOIN project.sell se 
               ON p.apn = se.property_id AND p.owner_id = se.owner_id
             LEFT JOIN project.users u_owner 
               ON p.owner_id = u_owner.user_id
             LEFT JOIN project.agent a 
               ON p.agent_lc_no = a.licence_no
             LEFT JOIN project.users u_agent 
               ON a.user_id = u_agent.user_id
             LEFT JOIN project.society s_info 
               ON p.society_reg_no = s_info.society_reg_no
             LEFT JOIN project.property_image pi 
               ON p.apn = pi.property_id
             LEFT JOIN project.individual_amenities ia 
               ON p.apn = ia.property_id
             LEFT JOIN project.amenities am 
               ON ia.amenity_name = am.amenity_name
             WHERE p.apn = $1
          `;

          const result = await pool.query(query, [apn]);
          
          if (result.rows.length === 0) {
             return NextResponse.json({message: "Property not found"}, {status: 404});
          }

          // Group results by property APN to handle multiple images and amenities
          const property = formatProperty(result.rows[0]);
          const processedImages = new Set();
          const processedAmenities = new Set();
          
          result.rows.forEach(row => {
             if (row.image_url && !processedImages.has(row.image_url)) {
                property.images.push({
                   url: row.image_url,
                   description: row.image_description
                });
                processedImages.add(row.image_url);
             }
             
             if (row.amenity_name && !processedAmenities.has(row.amenity_name)) {
                property.amenities.push(row.amenity_name);
                processedAmenities.add(row.amenity_name);
             }
          });

          console.log(`Found property with APN: ${apn}`);
          
          return NextResponse.json({
             success: true,
             property: property
          }, {status: 200});
       }

       // Otherwise, fallback to location-based search
       const { state, city, district } = body;

       if (!state) {
          return NextResponse.json({message: "State is required for location-based search"}, {status: 400});
       }

       console.log("Fetching properties based on location - State:", state, "City:", city, "District:", district);

       // Query with priority matching: exact match (state + city + district) OR state-only fallback
       const query = `
          SELECT 
            p.apn,
            p.built_year,
            p.status,
            p.map_url,
            p.area,
            p.state,
            p.city,
            p.district,
            p.local_address,
            p.pincode,
            p.neighborhood_info,
            p.title,
            p.available_for,
            p.type,
            p.tour_url,
            p.society_reg_no,
            r.monthly_rent,
            r.security_deposit,
            s.price,
            u.user_id,
            u.name as owner_name,
            u.contact_no as owner_contact,
            u.email as owner_email,
            pi.image_url,
            pi.description as image_description,
            CASE 
              WHEN p.state = $1 AND p.city = $2 AND p.district = $3 THEN 1
              ELSE 2
            END as match_priority
          FROM project.property p
          LEFT JOIN project.rent r 
            ON p.apn = r.property_id AND p.owner_id = r.owner_id
          LEFT JOIN project.sell s 
            ON p.apn = s.property_id AND p.owner_id = s.owner_id
          LEFT JOIN project.users u 
            ON p.owner_id = u.user_id
          LEFT JOIN project.property_image pi 
            ON p.apn = pi.property_id
          WHERE p.status = 'Available'
            AND (
              (p.state = $1 AND p.city = $2 AND p.district = $3)
              OR (p.state = $1)
            )
          ORDER BY match_priority ASC, p.apn ASC
       `;

       const result = await pool.query(query, [state, city, district]);
       
       console.log(`Found ${result.rows.length} properties matching location criteria`);
       
       // Group results by property APN to handle multiple images per property
       const propertiesMap = new Map();
       
       result.rows.forEach(row => {
          const apnKey = row.apn;
          if (!propertiesMap.has(apnKey)) {
             propertiesMap.set(apnKey, formatProperty(row));
          }
          
          // Add image if present
          if (row.image_url) {
             propertiesMap.get(apnKey).images.push({
                url: row.image_url,
                description: row.image_description
             });
          }
       });

       const properties = Array.from(propertiesMap.values());
       
       return NextResponse.json({
          success: true,
          count: properties.length,
          properties: properties
       }, {status: 200});
       
    }
    catch(error)
    {
         console.error("Error fetching properties: ", error);
        return NextResponse.json({message: "Error fetching properties", error: error.message}, {status: 500});
    }
}
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";

const validateSocietyRegNo = (value) => /^SOCI\d{3,}$/.test(value);

export async function POST(request) {
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

  const body = await request.json();
  const userid = session.user.id;

  const {
    apn,
    title,
    type,
    builtYear,
    area,
    availableFor,
    neighborhoodInfo,
    tourUrl,
    agentLcNo,
    state,
    city,
    district,
    localAddress,
    pincode,
    mapUrl,
    partOfSociety,
    societyRegNo,
    societyName,
    sellPrice,
    monthlyRent,
    securityDeposit,
    amenities,
    sharedAmenities,
    imageUrls,
  } = body;

  const errors = {};
  const apnNum = Number(apn);
  const builtYearNum = Number(builtYear);
  const areaNum = Number(area);
  const pincodeNum = Number(pincode);
  const sellPriceNum = Number(sellPrice);
  const monthlyRentNum = Number(monthlyRent);
  const securityDepositNum = Number(securityDeposit);
  const agentLicenseNum = agentLcNo?.toString().trim() ? Number(agentLcNo) : null;

  if (!apn?.toString().trim() || Number.isNaN(apnNum) || !Number.isInteger(apnNum) || apnNum <= 0) {
    errors.apn = "APN must be a valid positive number.";
  }
  if (!title?.trim()) {
    errors.title = "Property title is required.";
  }
  if (!type?.trim()) {
    errors.type = "Property type is required.";
  }
  if (!builtYear?.toString().trim() || Number.isNaN(builtYearNum) || !Number.isInteger(builtYearNum)) {
    errors.builtYear = "Built year is required.";
  }
  if (!area?.toString().trim() || Number.isNaN(areaNum) || areaNum <= 0) {
    errors.area = "Area must be a positive number.";
  }
  if (!availableFor?.trim() || !["Rent", "Sell", "Both"].includes(availableFor)) {
    errors.availableFor = "Available for must be Rent, Sell, or Both.";
  }
  if (!state?.trim()) {
    errors.state = "State is required.";
  }
  if (!city?.trim()) {
    errors.city = "City is required.";
  }
  if (!district?.trim()) {
    errors.district = "District is required.";
  }
  if (!localAddress?.trim()) {
    errors.localAddress = "Local address is required.";
  }
  if (!pincode?.toString().trim() || Number.isNaN(pincodeNum) || !/^[0-9]{6}$/.test(pincode?.toString().trim())) {
    errors.pincode = "Pincode must be a valid 6-digit number.";
  }
  if (!neighborhoodInfo?.trim()) {
    errors.neighborhoodInfo = "Neighborhood information is required.";
  }

  const needsSell = availableFor === "Sell" || availableFor === "Both";
  const needsRent = availableFor === "Rent" || availableFor === "Both";
  if (needsSell) {
    if (!sellPrice?.toString().trim() || Number.isNaN(sellPriceNum) || sellPriceNum <= 0) {
      errors.sellPrice = "Sell price is required and must be a positive number.";
    }
  }
  if (needsRent) {
    if (!monthlyRent?.toString().trim() || Number.isNaN(monthlyRentNum) || monthlyRentNum <= 0) {
      errors.monthlyRent = "Monthly rent is required and must be a positive number.";
    }
    if (!securityDeposit?.toString().trim() || Number.isNaN(securityDepositNum) || securityDepositNum < 0) {
      errors.securityDeposit = "Security deposit is required and must be a valid number.";
    }
  }

  if (partOfSociety) {
    if (!societyRegNo?.toString().trim()) {
      errors.societyRegNo = "Society registration number is required.";
    } else if (!validateSocietyRegNo(societyRegNo.toString().trim())) {
      errors.societyRegNo = "Society registration number must be in the format SOCI###.";
    }
    if (!societyName?.trim()) {
      errors.societyName = "Society name is required when the property is part of a society.";
    }
  }

  if (agentLicenseNum !== null && (Number.isNaN(agentLicenseNum) || !Number.isInteger(agentLicenseNum))) {
    errors.agentLcNo = "Agent licence number must be numeric.";
  }

  if (!Array.isArray(amenities)) {
    errors.amenities = "Amenities must be an array.";
  }
  if (!Array.isArray(imageUrls) || imageUrls.filter((url) => url?.toString().trim()).length === 0) {
    errors.imageUrls = "At least one image URL is required.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", details: errors }, { status: 400 });
  }


  try {
    if (agentLicenseNum !== null) {
      const query = "SELECT 1 FROM project.Agent WHERE Licence_no = $1";
      const agentExists = await pool.query(query, [agentLicenseNum]);
      if (agentExists.rowCount === 0) {
        return NextResponse.json(
          { error: "Agent not found.", details: { agentLcNo: "The provided agent licence number does not exist." } },
          { status: 400 }
        );
      }
    }

    let societyForeignKey = null;
    if (partOfSociety) {
      const trimmedSocietyRegNo = societyRegNo.toString().trim();
      const query = "SELECT Society_reg_no FROM project.Society WHERE Society_reg_no = $1";
      const societyResult = await pool.query(query, [trimmedSocietyRegNo]);
      if (societyResult.rowCount === 0) {
        const insertSocietyQuery =
          "INSERT INTO project.Society (Society_reg_no, Society_name) VALUES ($1, $2)";
        await pool.query(insertSocietyQuery, [trimmedSocietyRegNo, societyName.toString().trim()]);
      }
      societyForeignKey = trimmedSocietyRegNo;
    }

    const insertPropertyText = `
      INSERT INTO project.Property (
        APN,
        Built_Year,
        Status,
        Map_Url,
        Area,
        State,
        City,
        District,
        Local_address,
        Pincode,
        Neighborhood_info,
        Title,
        Available_For,
        Type,
        Tour_URL,
        Society_reg_no,
        Owner_id,
        Agent_lc_no
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`;

    await pool.query(insertPropertyText, [
      apnNum,
      builtYearNum,
      "Available",
      mapUrl?.trim() || null,
      areaNum,
      state.toString().trim(),
      city.toString().trim(),
      district.toString().trim(),
      localAddress.toString().trim(),
      pincodeNum,
      neighborhoodInfo.toString().trim(),
      title.toString().trim(),
      availableFor,
      type.toString().trim(),
      tourUrl?.trim() || null,
      societyForeignKey,
      userid,
      agentLicenseNum,
    ]);

    if (needsSell) {
      const query =
        "INSERT INTO project.Sell (Property_Id, Owner_id, Price, Agent_lc_no) VALUES ($1, $2, $3, $4)";
      await pool.query(query, [apnNum, userid, sellPriceNum, agentLicenseNum]);
    }

    if (needsRent) {
      const query =
        "INSERT INTO project.Rent (Property_Id, Owner_id, Monthly_Rent, Security_Deposit, Agent_lc_no) VALUES ($1, $2, $3, $4, $5)";
      await pool.query(query, [apnNum, userid, monthlyRentNum, securityDepositNum, agentLicenseNum]);
    }

    if (Array.isArray(amenities) && amenities.length > 0) {
      for (const amenity of amenities) {
        const name = amenity?.toString().trim();
        if (!name) continue;
        const insertAmenityQuery =
          "INSERT INTO project.Amenities (Amenity_name) VALUES ($1) ON CONFLICT (Amenity_name) DO NOTHING";
        await pool.query(insertAmenityQuery, [name]);
        const insertIndividualAmenityQuery =
          "INSERT INTO project.Individual_amenities (Property_Id, Amenity_name) VALUES ($1, $2) ON CONFLICT DO NOTHING";
        await pool.query(insertIndividualAmenityQuery, [apnNum, name]);
      }
    }

    if (partOfSociety && Array.isArray(sharedAmenities) && sharedAmenities.length > 0) {
      for (const sharedAmenity of sharedAmenities) {
        const name = sharedAmenity?.toString().trim();
        if (!name) continue;
        const insertSharedAmenityQuery =
          "INSERT INTO project.Amenities (Amenity_name) VALUES ($1) ON CONFLICT (Amenity_name) DO NOTHING";
        await pool.query(insertSharedAmenityQuery, [name]);
        const insertSharedAmenityLinkQuery =
          "INSERT INTO project.Shared_amenities (Society_reg_no, Amenity_name) VALUES ($1, $2) ON CONFLICT DO NOTHING";
        await pool.query(insertSharedAmenityLinkQuery, [societyForeignKey, name]);
      }
    }

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        const url = imageUrl?.toString().trim();
        if (!url) continue;
        const query =
          "INSERT INTO project.Property_Image (Image_Url, Description, Property_Id) VALUES ($1, $2, $3) ON CONFLICT (Image_Url) DO NOTHING";
        await pool.query(query, [url, null, apnNum]);
      }
    }
    return NextResponse.json(
      { message: "Successfully added your property!", propertyId: apnNum },
      { status: 201 }
    );
  } catch (err) {
    console.error("Property creation error:", err);
    const message = err?.code === "23505" ? "Property already exists or unique constraint violated." : "Error adding property.";
    return NextResponse.json({ error: message, details: err?.message }, { status: 500 });
  } 
}
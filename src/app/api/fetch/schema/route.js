import pool from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    // Query 1: Columns
    const columnsQuery = `
      SELECT table_name, column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'project'
      ORDER BY table_name, ordinal_position
    `;
    const columnsResult = await pool.query(columnsQuery);

    // Query 2: Primary Keys
    const pkQuery = `
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'project'
    `;
    const pkResult = await pool.query(pkQuery);

    // Query 3: Foreign Keys
    const fkQuery = `
      SELECT 
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'project'
    `;
    const fkResult = await pool.query(fkQuery);

    // --- Combine into nested structure ---
    const tables = {};
    // Step 1: Initialize each table with its columns
    for (const row of columnsResult.rows) {
      const { table_name, column_name, data_type, is_nullable } = row;

      if (!tables[table_name]) {
        tables[table_name] = {
          columns: [],
          primary_key: [],
          foreign_keys: [],
        };
      }

      tables[table_name].columns.push({
        name: column_name,
        type: data_type,
        nullable: is_nullable === "YES",
      });
    }

    // Step 2: Attach primary keys
    for (const row of pkResult.rows) {
      const { table_name, column_name } = row;
      if (tables[table_name]) {
        tables[table_name].primary_key.push(column_name);
      }
    }

    // Step 3: Attach foreign keys
    for (const row of fkResult.rows) {
      const { source_table, source_column, target_table, target_column } = row;
      if (tables[source_table]) {
        tables[source_table].foreign_keys.push({
          column: source_column,
          references_table: target_table,
          references_column: target_column,
        });
      }
    }

    return NextResponse.json({ tables });

  } catch (err) {
    console.error("Schema fetch error:", err.message);
    return NextResponse.json({ error: "Failed to fetch schema" }, { status: 500 });
  }
}
import fs from 'fs';

const SUPABASE_URL = 'https://pqladcebnqmovnskcklk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA';

async function updateCategory() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/industry_reports?category=eq.学生`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ category: '学生科研' })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update category: ${error}`);
  }

  const result = await response.json();
  console.log(`✅ Updated ${result.length} records from "学生" to "学生科研"`);
  return result;
}

updateCategory().catch(err => console.error('❌ Error:', err.message));

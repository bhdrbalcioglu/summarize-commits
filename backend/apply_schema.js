// apply_schema.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  try {
    console.log('🔧 [SCHEMA] Reading schema file...');
    const schemaPath = path.join(__dirname, 'backend/supabase_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 [SCHEMA] Applying schema to Supabase...');
    console.log('🔧 [SCHEMA] Creating private schema if not exists...');
    
    // First, ensure private schema exists
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE SCHEMA IF NOT EXISTS private;'
    });
    
    if (schemaError) {
      console.error('❌ [SCHEMA] Error creating private schema:', schemaError);
      process.exit(1);
    }
    
    console.log('✅ [SCHEMA] Private schema ready');
    
    // Split the schema into individual statements and execute them
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 [SCHEMA] Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      try {
        console.log(`🔧 [SCHEMA] Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.warn(`⚠️ [SCHEMA] Warning on statement ${i + 1}:`, error.message);
          // Don't exit on warnings - some statements might fail if objects already exist
        }
      } catch (err) {
        console.warn(`⚠️ [SCHEMA] Exception on statement ${i + 1}:`, err.message);
      }
    }
    
    // Test if oauth_tokens table exists
    console.log('🔧 [SCHEMA] Testing oauth_tokens table...');
    const { data, error: testError } = await supabase
      .schema('private')
      .from('oauth_tokens')
      .select('user_id')
      .limit(1);
    
    if (testError) {
      console.error('❌ [SCHEMA] oauth_tokens table test failed:', testError);
      process.exit(1);
    }
    
    console.log('✅ [SCHEMA] Schema applied successfully!');
    console.log('✅ [SCHEMA] oauth_tokens table is accessible');
    
  } catch (error) {
    console.error('❌ [SCHEMA] Error applying schema:', error);
    process.exit(1);
  }
}

applySchema(); 
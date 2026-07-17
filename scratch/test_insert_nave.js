import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envVars = {};
fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8').split('\n').forEach(l => {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('properties').insert([{
    operation: 'venta',
    type: 'nave',
    price: 100000,
    address_hidden: 'Test Calle 123',
    address_public: 'Test Zona',
    city: 'Valladolid',
    province: 'Valladolid',
    zipcode: '47001',
    area_built: 200,
    area_useful: 180,
    condition: 'buen_estado',
    title: 'Nave de prueba para verificación de base de datos',
    description: 'Descripción larga de prueba que tiene más de cincuenta caracteres para pasar la validación del backend o frontend si existe.',
    specific_features: {}
  }]).select();

  if (error) {
    console.error("Test failed as expected or with database error:", error.message);
  } else {
    console.log("Successfully inserted a 'nave'! Database already has the enum value:", data);
    // Cleanup
    await supabase.from('properties').delete().eq('id', data[0].id);
    console.log("Cleaned up test property.");
  }
}

test();

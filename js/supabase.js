
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = SUPABASE_DATABASE_URL;
const supabaseKey = SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
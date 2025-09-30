import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = 'https://iwbknenqfyvvtugnsxic.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3YmtuZW5xZnl2dnR1Z25zeGljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM1NDY2OSwiZXhwIjoyMDY5OTMwNjY5fQ.OhunmkBfeSQt67m-uYMlUhYakfZPJ2W_QzZS3bthby0';
export const supabase = createClient(supabaseUrl, supabaseKey);

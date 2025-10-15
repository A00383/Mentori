import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://ycbujchvtgfbxiqexdeo.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYnVqY2h2dGdmYnhpcWV4ZGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjE1NDEsImV4cCI6MjA3MzczNzU0MX0.Ruo65SqzlRDGSIf3w5-juU0aJUCLXuzqPl6ZAog4pyQ"

window.supabase = createClient(supabaseUrl, supabaseAnonKey);
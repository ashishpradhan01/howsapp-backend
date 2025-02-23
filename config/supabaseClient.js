const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const SUPABASE_URL = process.env.SUPABASE_URL_FILE
  ? fs.readFileSync(process.env.SUPABASE_URL_FILE, "utf8").trim()
  : process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY_FILE
  ? fs.readFileSync(process.env.SUPABASE_KEY_FILE, "utf8").trim()
  : process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;

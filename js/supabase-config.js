import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL = "https://qadixyjmrripwurzwokt.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZGl4eWptcnJpcHd1cnp3b2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTUxOTUsImV4cCI6MjA5MTgzMTE5NX0.YwG9T2yj2d5B9qPtjF9AzCZhek_ogYhMGe91u5uqX_w";
export const STORAGE_BUCKET = "imgIlsognatore";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

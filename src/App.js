import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qptkjqjhxxoplhvvkjum.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = createClient(supabaseUrl, supabaseKey);

// (Remaining component omitted for brevity)

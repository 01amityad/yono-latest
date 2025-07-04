import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
<input type="text" />
<button>Add</button>
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qptkjqjhxxoplhvvkjum.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const supabase = createClient(supabaseUrl, supabaseKey);

// (Remaining component omitted for brevity)

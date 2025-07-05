import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_ANON_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PublicAppGallery() {
  const [apps, setApps] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    setLoading(true);
    const { data, error } = await supabase.from("apps").select("*").order("created_at", { ascending: false });
    setApps(data || []);
    setLoading(false);
  }

  // Search + Tag/Keyword filter
  const filteredApps = apps.filter(app =>
    (app.name?.toLowerCase().includes(query.toLowerCase()) ||
      app.keywords?.toLowerCase().includes(query.toLowerCase()) ||
      app.tags?.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-4 text-center">🟢 Yonovip App Store</h1>

      <input
        type="text"
        placeholder="Search app name, tag, keyword..."
        className="border px-3 py-2 rounded w-full mb-6"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {loading ? (
        <p className="text-center">Loading apps...</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredApps.length === 0 && <p>No apps found.</p>}
          {filteredApps.map(app => (
            <div className="border rounded-lg p-4 flex flex-col shadow" key={app.id}>
              <div className="flex items-center mb-2">
                <img
                  src={app.icon_url || "/dummy-logo.png"}
                  alt={app.name}
                  className="w-14 h-14 rounded bg-gray-200 mr-4 object-cover"
                />
                <div>
                  <h2 className="text-lg font-semibold">{app.name}</h2>
                  <div className="text-xs text-gray-500">{app.tags}</div>
                </div>
              </div>
              <div className="text-sm text-gray-700 mb-2 line-clamp-2">{app.description}</div>
              <div className="flex items-center text-xs mb-2">
                <span>⬇ {app.downloads || 0} downloads</span>
                <span className="mx-2">|</span>
                <span>👁 {app.impressions || 0} views</span>
              </div>
              <a
                href={app.apk_url || app.download_link}
                className="bg-green-600 hover:bg-green-700 text-white text-center rounded px-4 py-2 font-medium"
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                Download APK
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

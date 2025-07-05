// src/App.js
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// === Supabase Config ===
const supabaseUrl = "https://qptkjqjhxxoplhvvkjum.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwdGtqcWpoeHhvcGxodnZranVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjM2NzcsImV4cCI6MjA2NzA5OTY3N30.BWuU10XsvP336yMkZRk10LDGCoDXGx6i0RGC3CgX3zU";
const supabase = createClient(supabaseUrl, supabaseKey);

function AdminPanel() {
  // AUTH STATE
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // APP STATE
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // FORM STATE
  const [form, setForm] = useState({
    id: null,
    name: "",
    description: "",
    icon_url: "",
    apk_url: "",
    download_link: "",
    ios_link: "",
    keywords: "",
    tags: "",
  });
  const [iconFile, setIconFile] = useState(null);
  const [apkFile, setApkFile] = useState(null);

  // ANALYTICS
  const [siteStats, setSiteStats] = useState({ visits: 0, downloads: 0 });

  // On Mount: Check Auth + fetch data
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchApps();
    fetchSiteStats();
    recordSiteVisit();
  }, []);

  // Record site visit (for analytics)
  const recordSiteVisit = async () => {
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("site_analytics")
      .upsert([{ date: today, visits: 1 }], { onConflict: "date", ignoreDuplicates: false })
      .select();
  };

  // Fetch all apps
  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("apps").select("*").order("created_at", { ascending: false });
    if (data) setApps(data);
    if (error) alert(error.message);
    setLoading(false);
  };

  // Fetch analytics (site visits, downloads)
  const fetchSiteStats = async () => {
    const { data } = await supabase.from("site_analytics").select("*");
    let visits = 0, downloads = 0;
    if (data) {
      data.forEach(row => {
        visits += row.visits || 0;
        downloads += row.downloads || 0;
      });
    }
    setSiteStats({ visits, downloads });
  };

  // Auth: login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const email = e.target.email.value;
    const password = e.target.password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else window.location.reload();
    setAuthLoading(false);
  };

  // File upload (icon or APK)
  const handleFileUpload = async (file, type = "icon") => {
    const ext = file.name.split('.').pop();
    const filename = `${type}_${Date.now()}.${ext}`;
    const path = `uploads/${filename}`;
    let { data, error } = await supabase.storage.from("uploads").upload(filename, file);
    if (error) {
      alert(`Failed to upload ${type}: ${error.message}`);
      return "";
    }
    return `${supabaseUrl}/storage/v1/object/public/uploads/${filename}`;
  };

  // Add/Edit app
  const handleSubmit = async (e) => {
    e.preventDefault();
    let iconUrl = form.icon_url;
    let apkUrl = form.apk_url;

    if (iconFile) iconUrl = await handleFileUpload(iconFile, "icon");
    if (apkFile) apkUrl = await handleFileUpload(apkFile, "apk");

    const appData = {
      name: form.name,
      description: form.description,
      icon_url: iconUrl,
      apk_url: apkUrl,
      download_link: form.download_link,
      ios_link: form.ios_link,
      keywords: form.keywords,
      tags: form.tags,
    };

    let error;
    if (form.id) {
      // Update
      ({ error } = await supabase.from("apps").update(appData).eq("id", form.id));
    } else {
      // Insert
      ({ error } = await supabase.from("apps").insert([{ ...appData, clicks: 0, downloads: 0, impressions: 0 }]));
    }
    if (error) alert(error.message);
    setForm({
      id: null, name: "", description: "", icon_url: "", apk_url: "",
      download_link: "", ios_link: "", keywords: "", tags: ""
    });
    setIconFile(null);
    setApkFile(null);
    fetchApps();
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await supabase.from("apps").delete().eq("id", id);
    fetchApps();
  };

  // For download count analytics
  const handleDownload = async (app) => {
    await supabase.from("apps").update({ downloads: (app.downloads || 0) + 1 }).eq("id", app.id);
    // Site analytics update
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("site_analytics")
      .upsert([{ date: today, downloads: 1 }], { onConflict: "date", ignoreDuplicates: false });
    fetchApps();
    fetchSiteStats();
  };

  // UI

  if (!user) {
    // Login Form
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="p-6 bg-white rounded shadow w-full max-w-sm flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-2 text-center">Admin Login</h2>
          <input name="email" type="email" placeholder="Email" required className="p-2 border rounded" />
          <input name="password" type="password" placeholder="Password" required className="p-2 border rounded" />
          {authError && <div className="text-red-600">{authError}</div>}
          <button type="submit" className="bg-black text-white py-2 rounded" disabled={authLoading}>
            {authLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 font-sans">
      <h1 className="text-3xl font-bold text-center mb-6">Yonovip Admin Panel</h1>

      {/* Analytics */}
      <div className="flex justify-between items-center gap-2 mb-4 text-sm bg-gray-50 p-3 rounded">
        <div>📈 <b>Total Site Visits:</b> {siteStats.visits}</div>
        <div>⬇️ <b>Total Downloads:</b> {siteStats.downloads}</div>
      </div>

      {/* Add/Edit App Form */}
      <div className="mb-6 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">{form.id ? "Edit App" : "Add New App"}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input placeholder="App Name" value={form.name} required
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="p-2 border rounded" />
          <textarea placeholder="Description" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="p-2 border rounded" />
          <input type="file" accept="image/*" onChange={e => setIconFile(e.target.files[0])} className="p-2" />
          <input type="file" accept=".apk" onChange={e => setApkFile(e.target.files[0])} className="p-2" />
          <input placeholder="Direct Download Link (optional)" value={form.download_link}
            onChange={e => setForm(f => ({ ...f, download_link: e.target.value }))} className="p-2 border rounded" />
          <input placeholder="iOS Link (optional)" value={form.ios_link}
            onChange={e => setForm(f => ({ ...f, ios_link: e.target.value }))} className="p-2 border rounded" />
          <input placeholder="Keywords (comma separated)" value={form.keywords}
            onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} className="p-2 border rounded" />
          <input placeholder="Tags (comma separated)" value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="p-2 border rounded" />
          <button type="submit" className="bg-blue-700 text-white py-2 rounded mt-1">
            {form.id ? "Update App" : "Add App"}
          </button>
        </form>
      </div>

      {/* App List */}
      <div>
        <h2 className="text-xl font-bold mb-3">All Apps</h2>
        {loading ? (
          <div className="text-gray-500 text-center">Loading apps...</div>
        ) : (
          apps.length === 0 ? (
            <div className="text-gray-400 text-center">No apps added yet.</div>
          ) : (
            apps.map(app => (
              <div key={app.id} className="bg-white p-4 mb-3 rounded shadow flex gap-3 items-start">
                <img src={app.icon_url} alt="icon" className="w-14 h-14 object-cover rounded border" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{app.name}</h3>
                    <span className="text-xs text-gray-500">{app.created_at?.slice(0, 10) || ""}</span>
                  </div>
                  <div className="text-sm mb-1">{app.description}</div>
                  <div className="text-xs text-gray-500 mb-1">
                    Tags: {app.tags} | Keywords: {app.keywords}
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500 mb-1">
                    <span>Impressions: {app.impressions || 0}</span>
                    <span>Clicks: {app.clicks || 0}</span>
                    <span>Downloads: {app.downloads || 0}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* Download Logic: Prefer APK, else download link */}
                    {app.apk_url ? (
                      <a href={app.apk_url} target="_blank" rel="noopener noreferrer"
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => handleDownload(app)}>
                        Download APK
                      </a>
                    ) : app.download_link ? (
                      <a href={app.download_link} target="_blank" rel="noopener noreferrer"
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => handleDownload(app)}>
                        Download
                      </a>
                    ) : null}
                    {app.ios_link && (
                      <a href={app.ios_link} target="_blank" rel="noopener noreferrer"
                        className="bg-gray-200 px-3 py-1 rounded border">
                        iOS
                      </a>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className="border px-3 py-1 rounded"
                      onClick={() => setForm({ ...app, id: app.id })}>Edit</button>
                    <button className="bg-red-600 text-white px-3 py-1 rounded"
                      onClick={() => handleDelete(app.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

export default AdminPanel;

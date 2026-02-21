"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../../lib/hooks/useAuth";
import { createBrowserClient } from "../../../lib/supabase/client";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target?.files?.[0];
    if (!file || !user) return;
    try {
      setUploading(true);
      const supabase = createBrowserClient();
      const path = `avatars/${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const publicData = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicData.data.publicUrl);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    setUsername(user.username ?? "");
    setEmail(user.email ?? "");
    setBio(user.bio ?? "");
    setAvatarUrl(user.avatar_url ?? null);
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, bio, avatar_url: avatarUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "Failed to save");
      }
      router.push("/profile");
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 max-w-3xl mx-auto">Loading…</div>;
  if (!user) return <div className="p-6 max-w-3xl mx-auto text-red-400">Not authenticated</div>;
  if (error) return <div className="p-6 max-w-3xl mx-auto text-red-400" role="alert">{error}</div>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 id="edit-profile-heading" className="text-2xl font-semibold mb-4">Edit Profile</h1>
      <form onSubmit={handleSave} aria-labelledby="edit-profile-heading" className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-1">
          <div className="text-sm text-gray-300">Username</div>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-gray-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </label>

        <label className="block md:col-span-1">
          <div className="text-sm text-gray-300">Email</div>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-gray-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </label>

        <label className="block md:col-span-2">
          <div className="text-sm text-gray-300">Bio</div>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 w-full rounded-md px-3 py-2 bg-gray-800 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </label>

        <label className="block md:col-span-2">
          <div className="text-sm text-gray-300">Avatar</div>
          <input id="avatar" type="file" accept="image/*" onChange={handleFileChange} className="mt-1 w-full text-sm text-gray-300" aria-describedby={uploading ? "avatar-uploading" : undefined} />
          {uploading && <div id="avatar-uploading" className="text-xs text-gray-400 mt-2" aria-live="polite">Uploading…</div>}
          {avatarUrl && (
            <div className="mt-2">
              <img src={avatarUrl} alt={`${user.username} avatar preview`} className="w-20 h-20 rounded-full object-cover" />
            </div>
          )}
        </label>

        <div className="flex items-center gap-3 md:col-span-2">
          <button type="submit" disabled={saving} className="rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => router.back()} className="rounded-xl px-4 py-2 border border-white/10">Cancel</button>
        </div>
      </form>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Trash2, Download, FileText, Folder as FolderIcon, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  head: () => ({ meta: [{ title: "Document Cabinet" }, { name: "robots", content: "noindex" }] }),
  component: Docs,
});

const FOLDERS = ["Legal", "Training", "Operations", "Marketing"] as const;
type Folder = typeof FOLDERS[number];

type Doc = {
  id: string;
  user_id: string;
  filename: string;
  folder: Folder;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
};

function Docs() {
  const { user, isAdmin } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [folder, setFolder] = useState<Folder>("Legal");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setDocs((data ?? []) as Doc[]);
  }
  useEffect(() => { load(); }, [user?.id]);

  async function upload(file: File) {
    if (!user) return;
    setBusy(true);
    const path = `${folder}/${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: false });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { error: insErr } = await supabase.from("documents").insert({
      user_id: user.id, filename: file.name, folder, storage_path: path,
      size_bytes: file.size, mime_type: file.type || null,
    });
    setBusy(false);
    if (insErr) return toast.error(insErr.message);
    toast.success("Uploaded.");
    load();
  }

  async function download(d: Doc) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 60);
    if (error || !data) return toast.error(error?.message ?? "Could not get download URL.");
    window.open(data.signedUrl, "_blank");
  }

  async function remove(d: Doc) {
    if (!confirm(`Delete ${d.filename}?`)) return;
    const { error: sErr } = await supabase.storage.from("documents").remove([d.storage_path]);
    if (sErr) return toast.error(sErr.message);
    await supabase.from("documents").delete().eq("id", d.id);
    load();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs.filter((d) => d.folder === folder && (!q || d.filename.toLowerCase().includes(q)));
  }, [docs, folder, query]);

  return (
    <AdminShell title="Document Cabinet">
      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="bg-surface/50 border border-gold/15 rounded-lg p-3 space-y-1 h-fit">
          {FOLDERS.map((f) => {
            const active = folder === f;
            const count = docs.filter((d) => d.folder === f).length;
            return (
              <button key={f} onClick={() => setFolder(f)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm border ${active ? "border-gold/40 bg-gold/10 text-gold" : "border-transparent text-sidebar-foreground hover:bg-gold/5"}`}>
                <span className="flex items-center gap-2"><FolderIcon className="size-4" /> {f}</span>
                <span className="text-[10px] opacity-60">{count}</span>
              </button>
            );
          })}
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${folder}…`}
                className="w-full bg-background border border-gold/20 rounded pl-10 pr-3 py-2 text-sm" />
            </div>
            <input ref={fileRef} type="file" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            <button disabled={busy} onClick={() => fileRef.current?.click()}
              className="gradient-gold text-gold-foreground font-medium px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50">
              <Upload className="size-4" /> {busy ? "Uploading…" : `Upload to ${folder}`}
            </button>
          </div>

          <div className="bg-surface/50 border border-gold/15 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">File</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-right p-3">Size</th>
                  <th className="text-left p-3">Uploaded</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No files in {folder}.</td></tr>}
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-gold/10 hover:bg-gold/5">
                    <td className="p-3 flex items-center gap-2 text-champagne"><FileText className="size-4 text-gold" /> {d.filename}</td>
                    <td className="p-3 text-muted-foreground text-xs">{d.mime_type ?? "—"}</td>
                    <td className="p-3 text-right text-muted-foreground tabular-nums">{d.size_bytes ? formatBytes(d.size_bytes) : "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="p-3 flex items-center justify-end gap-1">
                      <button onClick={() => download(d)} className="text-muted-foreground hover:text-gold p-1.5"><Download className="size-4" /></button>
                      {(d.user_id === user?.id || isAdmin) && (
                        <button onClick={() => remove(d)} className="text-muted-foreground hover:text-destructive p-1.5"><Trash2 className="size-4" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

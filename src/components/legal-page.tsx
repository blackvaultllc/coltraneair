import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-gold/15">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
            <ArrowLeft className="size-4" /> Back to {BRAND}
          </Link>
          <span className="text-xs uppercase tracking-[0.3em] text-gold/80">Legal</span>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <h1 className="font-display text-4xl md:text-5xl text-champagne mb-2">{title}</h1>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-10">Last updated: {updated}</p>
        <div className="prose-luxury space-y-6 text-foreground/90 leading-relaxed text-[15px]">
          {children}
        </div>
      </article>
      <footer className="border-t border-gold/15 px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND}. All rights reserved.
      </footer>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl text-gold mt-10 mb-3">{children}</h2>;
}

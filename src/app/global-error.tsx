"use client";

import { useEffect } from "react";
import { ArrowLeft, LayoutDashboard, RefreshCcw, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Cost Optimizer Admin global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={styles.body}>
        <main style={styles.page}>
          <aside style={styles.sidebar} aria-hidden="true">
            <div style={styles.brandBar}>
              <div style={styles.brandIcon}>
                <ShieldAlert size={16} aria-hidden="true" />
              </div>
              <p style={styles.brandText}>Admin Panel</p>
            </div>
          </aside>

          <section style={styles.content} aria-label="Global application error">
            <div style={styles.card}>
              <div style={styles.errorIcon}>
                <ShieldAlert size={24} aria-hidden="true" />
              </div>

              <p style={styles.eyebrow}>Application error</p>
              <h1 style={styles.title}>The admin application could not be loaded.</h1>
              <p style={styles.description}>
                Try again, go back to the previous page, or return to the dashboard.
              </p>

              {error.digest ? (
                <p style={styles.digest}>Error reference: {error.digest}</p>
              ) : null}

              <div style={styles.actions}>
                <button type="button" onClick={reset} style={styles.primaryButton}>
                  <RefreshCcw size={13} aria-hidden="true" />
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  style={styles.secondaryButton}
                >
                  <ArrowLeft size={13} aria-hidden="true" />
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={() => window.location.assign("/")}
                  style={styles.secondaryButton}
                >
                  <LayoutDashboard size={13} aria-hidden="true" />
                  Dashboard
                </button>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}

const styles = {
  body: {
    margin: 0,
    minHeight: "100vh",
    background: "#FFFFFF",
    color: "#171717",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#FFFFFF",
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    borderRight: "1px solid rgba(0, 0, 0, 0.08)",
    background: "#FFFFFF",
  },
  brandBar: {
    display: "flex",
    height: 56,
    alignItems: "center",
    gap: 8,
    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
    padding: "0 20px",
  },
  brandIcon: {
    display: "flex",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    background: "#000000",
    color: "#FFFFFF",
  },
  brandText: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1,
  },
  content: {
    display: "flex",
    minHeight: "100vh",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    border: "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: 6,
    background: "#FFFFFF",
    boxShadow: "0 18px 60px rgba(15, 23, 42, 0.08)",
    padding: 24,
    textAlign: "center" as const,
  },
  errorIcon: {
    display: "flex",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    borderRadius: 6,
    background: "#FEF2F2",
    color: "#EF4444",
  },
  eyebrow: {
    margin: "20px 0 0",
    color: "#86868B",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1.15,
  },
  description: {
    maxWidth: 420,
    margin: "12px auto 0",
    color: "#86868B",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: "24px",
  },
  digest: {
    margin: "16px 0 0",
    borderRadius: 6,
    background: "#F5F5F5",
    color: "#86868B",
    fontSize: 12,
    fontWeight: 600,
    padding: "8px 12px",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap" as const,
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  primaryButton: {
    display: "inline-flex",
    height: 36,
    alignItems: "center",
    gap: 8,
    border: 0,
    borderRadius: 6,
    background: "#007AFF",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    padding: "0 16px",
  },
  secondaryButton: {
    display: "inline-flex",
    height: 36,
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(0, 0, 0, 0.08)",
    borderRadius: 6,
    background: "#FFFFFF",
    color: "#555555",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    padding: "0 16px",
  },
} as const;

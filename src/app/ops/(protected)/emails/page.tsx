"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface EmailEntry {
  id: string;
  number: number;
  name: string;
  category: string;
  recipient: "comprador" | "comercio" | "repartidor" | "admin" | "owner";
  priority: "P0" | "P1" | "P2" | "P3";
  status: "implemented" | "new" | "partial";
  trigger: string;
  subject: string;
  functionName: string;
  file: string;
}

interface EmailPreview extends EmailEntry {
  html: string;
}

const RECIPIENT_COLORS: Record<string, { bg: string; text: string }> = {
  comprador: { bg: "#dbeafe", text: "#1e40af" },
  comercio: { bg: "#fef3c7", text: "#92400e" },
  repartidor: { bg: "#d1fae5", text: "#065f46" },
  admin: { bg: "#e0e7ff", text: "#3730a3" },
  owner: { bg: "#fce7f3", text: "#9d174d" },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  implemented: { label: "Implementado", bg: "#def7ec", text: "#03543f" },
  new: { label: "Nuevo", bg: "#dbeafe", text: "#1e40af" },
  partial: { label: "Parcial", bg: "#fffbeb", text: "#92400e" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  P0: { bg: "#fef2f2", text: "#991b1b" },
  P1: { bg: "#fffbeb", text: "#92400e" },
  P2: { bg: "#eff6ff", text: "#1e40af" },
  P3: { bg: "#f3f4f6", text: "#6b7280" },
};

export default function OpsEmailsPage() {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterRecipient, setFilterRecipient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [search, setSearch] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Config de destinatarios de alertas
  const [alertEmails, setAlertEmails] = useState("");
  const [alertEmailsSaved, setAlertEmailsSaved] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEmails();
    fetchAlertConfig();
  }, []);

  async function fetchAlertConfig() {
    try {
      const res = await fetch("/api/ops/config/global");
      const data = await res.json();
      const alertConfig = (data.configs || []).find((c: { key: string }) => c.key === "alert_emails");
      if (alertConfig) {
        setAlertEmails(alertConfig.value);
        setAlertEmailsSaved(alertConfig.value);
      }
    } catch {
      // silently fail - will use fallback
    }
  }

  async function saveAlertConfig() {
    setSavingConfig(true);
    setConfigMessage(null);
    try {
      // Validar formato
      const emails = alertEmails.split(",").map(e => e.trim()).filter(e => e.length > 0);
      const invalidEmails = emails.filter(e => !e.includes("@") || !e.includes("."));
      if (emails.length === 0) {
        setConfigMessage({ type: "error", text: "Ingresá al menos un email" });
        setSavingConfig(false);
        return;
      }
      if (invalidEmails.length > 0) {
        setConfigMessage({ type: "error", text: `Emails inválidos: ${invalidEmails.join(", ")}` });
        setSavingConfig(false);
        return;
      }

      const cleanValue = emails.join(", ");
      const res = await fetch("/api/ops/config/global", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "alert_emails", value: cleanValue }),
      });

      if (res.ok) {
        setAlertEmails(cleanValue);
        setAlertEmailsSaved(cleanValue);
        setConfigMessage({ type: "success", text: "Guardado correctamente" });
        setTimeout(() => setConfigMessage(null), 3000);
      } else {
        setConfigMessage({ type: "error", text: "Error al guardar" });
      }
    } catch {
      setConfigMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSavingConfig(false);
    }
  }

  async function fetchEmails() {
    try {
      const res = await fetch("/api/ops/emails/preview");
      const data = await res.json();
      setEmails(data.emails || []);
    } catch {
      console.error("Error fetching emails");
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview(id: string) {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/ops/emails/preview?id=${id}`);
      const data = await res.json();
      setSelectedEmail(data);
    } catch {
      console.error("Error loading preview");
    } finally {
      setPreviewLoading(false);
    }
  }

  const handlePrintPdf = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !selectedEmail) return;
    const iframeDoc = iframeRef.current.contentDocument;
    if (!iframeDoc) return;

    // Write the email HTML into the iframe
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedEmail.name} - MOOVY Email Preview</title>
        <style>
          @media print {
            body { margin: 0; }
            @page { margin: 1cm; }
          }
        </style>
      </head>
      <body>${selectedEmail.html}</body>
      </html>
    `);
    iframeDoc.close();

    // Trigger print dialog (user can save as PDF)
    setTimeout(() => {
      iframeRef.current?.contentWindow?.print();
    }, 300);
  }, [selectedEmail]);

  const categories = [...new Set(emails.map((e) => e.category))];

  const filtered = emails.filter((e) => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    if (filterRecipient !== "all" && e.recipient !== filterRecipient) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterPriority !== "all" && e.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.functionName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        String(e.number).includes(q)
      );
    }
    return true;
  });

  // Stats
  const totalEmails = emails.length;
  const implementedCount = emails.filter((e) => e.status === "implemented").length;
  const newCount = emails.filter((e) => e.status === "new").length;
  const partialCount = emails.filter((e) => e.status === "partial").length;

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: 1, background: "#f3f4f6", borderRadius: 12, height: 80, animation: "pulse 2s infinite" }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ background: "#f3f4f6", borderRadius: 8, height: 48, marginBottom: 8, animation: "pulse 2s infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
          Gestión de Emails
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
          Previsualizá y gestioná todos los correos del sistema MOOVY
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{totalEmails}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Total emails registrados</div>
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#059669" }}>{implementedCount}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Ya implementados</div>
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb" }}>{newCount}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Nuevos (P0)</div>
        </div>
        <div style={{ background: "white", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#d97706" }}>{partialCount}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>Parciales</div>
        </div>
      </div>

      {/* Configuración de destinatarios de alertas */}
      <div style={{
        background: "white",
        borderRadius: 12,
        padding: 20,
        border: "1px solid #e5e7eb",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>&#9881;</span>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
            Destinatarios de alertas
          </h3>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 10,
            background: "#fce7f3", color: "#9d174d", fontWeight: 500,
          }}>Owner</span>
        </div>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 12px 0" }}>
          Los emails de alertas cr&iacute;ticas, reportes diarios y compliance se env&iacute;an a estos destinatarios.
          Pod&eacute;s poner varios separados por coma.
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={alertEmails}
              onChange={(e) => setAlertEmails(e.target.value)}
              placeholder="ej: mauro@ejemplo.com, ops@moovy.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {alertEmailsSaved && (
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                Configurado: <strong>{alertEmailsSaved}</strong>
              </div>
            )}
            {!alertEmailsSaved && (
              <div style={{ fontSize: 12, color: "#d97706", marginTop: 4 }}>
                No configurado &mdash; las alertas ir&aacute;n al email admin por defecto
              </div>
            )}
          </div>
          <button
            onClick={saveAlertConfig}
            disabled={savingConfig || alertEmails === alertEmailsSaved}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: alertEmails !== alertEmailsSaved ? "#e60012" : "#d1d5db",
              color: alertEmails !== alertEmailsSaved ? "white" : "#9ca3af",
              fontSize: 14,
              fontWeight: 600,
              cursor: alertEmails !== alertEmailsSaved ? "pointer" : "default",
              whiteSpace: "nowrap",
              opacity: savingConfig ? 0.6 : 1,
            }}
          >
            {savingConfig ? "Guardando..." : "Guardar"}
          </button>
        </div>
        {configMessage && (
          <div style={{
            marginTop: 8,
            fontSize: 13,
            color: configMessage.type === "success" ? "#059669" : "#dc2626",
            fontWeight: 500,
          }}>
            {configMessage.text}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Buscar por nombre, función o asunto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 14,
            outline: "none",
          }}
        />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}>
          <option value="all">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterRecipient} onChange={(e) => setFilterRecipient(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}>
          <option value="all">Todos los destinatarios</option>
          <option value="comprador">Comprador</option>
          <option value="comercio">Comercio</option>
          <option value="repartidor">Repartidor</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}>
          <option value="all">Todos los estados</option>
          <option value="implemented">Implementado</option>
          <option value="new">Nuevo</option>
          <option value="partial">Parcial</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, background: "white" }}>
          <option value="all">Todas las prioridades</option>
          <option value="P0">P0 - Obligatorio</option>
          <option value="P1">P1 - Importante</option>
          <option value="P2">P2 - Segundo mes</option>
          <option value="P3">P3 - Nice-to-have</option>
        </select>
      </div>

      {/* Main layout: table + preview */}
      <div style={{ display: "grid", gridTemplateColumns: selectedEmail ? "1fr 1fr" : "1fr", gap: 24 }}>
        {/* Email list */}
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
              {filtered.length} email{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ maxHeight: "calc(100vh - 380px)", overflowY: "auto" }}>
            {filtered.map((email) => {
              const rc = RECIPIENT_COLORS[email.recipient] || { bg: "#f3f4f6", text: "#6b7280" };
              const sc = STATUS_CONFIG[email.status] || { label: email.status, bg: "#f3f4f6", text: "#6b7280" };
              const pc = PRIORITY_COLORS[email.priority] || { bg: "#f3f4f6", text: "#6b7280" };
              const isSelected = selectedEmail?.id === email.id;

              return (
                <div
                  key={email.id}
                  onClick={() => loadPreview(email.id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    background: isSelected ? "#eff6ff" : "white",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = "white";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, minWidth: 28 }}>#{email.number}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", flex: 1 }}>{email.name}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 10,
                      background: pc.bg, color: pc.text, fontWeight: 600,
                    }}>{email.priority}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginLeft: 36 }}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 10,
                      background: rc.bg, color: rc.text, fontWeight: 500,
                    }}>{email.recipient}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 10,
                      background: sc.bg, color: sc.text, fontWeight: 500,
                    }}>{sc.label}</span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                No se encontraron emails con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>

        {/* Preview panel */}
        {selectedEmail && (
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            {/* Preview header */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                    {selectedEmail.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {selectedEmail.subject}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handlePrintPdf}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      background: "white",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    📄 Descargar PDF
                  </button>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      background: "white",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                <div><strong>Función:</strong> <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>{selectedEmail.functionName}</code></div>
                <div><strong>Archivo:</strong> <code style={{ background: "#f3f4f6", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>{selectedEmail.file}</code></div>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                <div><strong>Trigger:</strong> {selectedEmail.trigger}</div>
              </div>
            </div>

            {/* Preview body */}
            <div style={{ maxHeight: "calc(100vh - 460px)", overflowY: "auto" }}>
              {previewLoading ? (
                <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
                  Cargando preview...
                </div>
              ) : (
                <div
                  style={{ padding: 16, background: "#e5e7eb" }}
                >
                  <div
                    style={{
                      background: "white",
                      borderRadius: 8,
                      overflow: "hidden",
                      maxWidth: 640,
                      margin: "0 auto",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                  />
                </div>
              )}
            </div>

            {/* Hidden iframe for PDF printing */}
            <iframe
              ref={iframeRef}
              style={{ display: "none", width: 0, height: 0 }}
              title="Email PDF Export"
            />
          </div>
        )}
      </div>
    </div>
  );
}

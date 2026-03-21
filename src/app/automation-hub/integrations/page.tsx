"use client";

import { Cloud, Mail, Calendar, Database, ArrowUpRight, CheckCircle2 } from "lucide-react";

const INTEGRATIONS = [
  {
    id: "google",
    name: "Google Workspace",
    description: "Sync Gmail, Google Calendar, and Google Contacts with your CRM.",
    icon: <Mail className="text-[#6366F1]" size={24} />,
    status: "available",
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    description: "Connect Outlook email, calendars, and contacts for seamless collaboration.",
    icon: <Calendar className="text-blue-500" size={24} />,
    status: "available",
  },
  {
    id: "salesforce",
    name: "Salesforce Import",
    description: "Migrate contacts, deals, and pipelines from Salesforce.",
    icon: <Cloud className="text-sky-400" size={24} />,
    status: "coming_soon",
  },
  {
    id: "hubspot",
    name: "HubSpot Sync",
    description: "Two-way sync contacts and deals with your HubSpot CRM.",
    icon: <Database className="text-orange-400" size={24} />,
    status: "coming_soon",
  },
];

export default function IntegrationsPage() {
  const handleConnect = (id: string) => {
    // In production: redirect to OAuth consent screen
    alert(`OAuth flow for ${id} would start here. This requires setting up OAuth client credentials in your .env file.`);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="md-headline-medium text-on-surface tracking-tight">Integrations</h1>
        <p className="text-on-surface-variant mt-2 md-body-large">
          Connect third-party services to supercharge your CRM workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.id}
            className={`bg-surface border border-outline-variant rounded-xl p-6 transition-all hover:border-outline`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-surface-container rounded-xl shadow-sm border border-outline-variant">
                {integration.icon}
              </div>
              {integration.status === "coming_soon" && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container border border-outline-variant text-on-surface-variant px-2.5 py-1 rounded-full shadow-sm">
                  Coming Soon
                </span>
              )}
            </div>
            <h3 className="md-title-medium font-bold mb-1 text-on-surface">{integration.name}</h3>
            <p className="md-body-small text-on-surface-variant mb-6">{integration.description}</p>
            <button
              onClick={() => handleConnect(integration.id)}
              disabled={integration.status === "coming_soon"}
              className={`w-full py-2.5 rounded-xl md-label-large flex items-center justify-center gap-2 transition-all duration-300 ${
                integration.status === "coming_soon"
                  ? "bg-surface-container-highest text-on-surface-variant border border-outline-variant cursor-not-allowed"
                  : "bg-primary text-on-primary hover:bg-primary/90 shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              }`}
            >
              {integration.status === "coming_soon" ? (
                "Coming Soon"
              ) : (
                <>
                  Connect <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-outline-variant rounded-xl p-6">
        <h2 className="md-title-small font-bold mb-4 flex items-center gap-2 text-on-surface">
          <CheckCircle2 size={16} className="text-success" /> Built-in Integrations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-surface-container rounded-xl p-4 border border-outline shadow-sm">
            <p className="md-label-large text-on-surface">Webhooks</p>
            <p className="text-on-surface-variant md-body-small mt-1">Manage in Settings → Webhooks</p>
          </div>
          <div className="bg-surface-container rounded-xl p-4 border border-outline shadow-sm">
            <p className="md-label-large text-on-surface">CSV Import</p>
            <p className="text-on-surface-variant md-body-small mt-1">Bulk import via Cold Leads</p>
          </div>
          <div className="bg-surface-container rounded-xl p-4 border border-outline shadow-sm">
            <p className="md-label-large text-on-surface">Workflow Automations</p>
            <p className="text-on-surface-variant md-body-small mt-1">Configure in Settings → Automations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

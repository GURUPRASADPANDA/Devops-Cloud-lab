import { useState, useEffect } from "react";

const SERVICES = [
  { id: "sandbox-localstack", label: "LocalStack", icon: "☁️" },
  { id: "sandbox-terraform", label: "Terraform", icon: "🔨" },
  { id: "sandbox-ansible", label: "Ansible", icon: "⚙️" },
  { id: "sandbox-backend", label: "Backend API", icon: "🔌" },
  { id: "sandbox-ui", label: "UI", icon: "🖥️" },
];

export default function Logs({ api }) {
  const [service, setService] = useState("sandbox-terraform");
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState(200);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/logs/${service}?lines=${lines}`);
      const text = await res.text();
      setLogs(text);
    } catch (e) {
      setLogs(`Error fetching logs: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, [service, lines]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Container Logs</h2>
        <p className="text-sm text-gray-400">View real-time output from any sandbox container</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {SERVICES.map(s => (
            <button
              key={s.id}
              onClick={() => setService(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                service === s.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={lines}
            onChange={e => setLines(e.target.value)}
            className="bg-gray-700 text-sm text-gray-300 rounded px-2 py-1.5 border border-gray-600"
          >
            <option value={50}>50 lines</option>
            <option value={200}>200 lines</option>
            <option value={500}>500 lines</option>
          </select>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            {loading ? "⟳" : "↻"} Refresh
          </button>
        </div>
      </div>

      {/* Log terminal */}
      <div className="bg-black rounded-lg border border-gray-700 p-4 h-[65vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 border-b border-gray-800 pb-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="ml-2 font-mono">{service} — last {lines} lines</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm">
            <span className="animate-spin">⟳</span> Loading...
          </div>
        ) : (
          <pre className="font-mono text-xs text-green-300 whitespace-pre-wrap leading-relaxed">
            {logs || "No logs available"}
          </pre>
        )}
      </div>
    </div>
  );
}

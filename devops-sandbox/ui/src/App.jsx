import { useState, useEffect, useCallback } from "react";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Infra from "./pages/Infra";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

function NavItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-400 hover:text-white hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [status, setStatus] = useState(null);
  const [containers, setContainers] = useState([]);
  const [outputs, setOutputs] = useState({});

  const refresh = useCallback(async () => {
    try {
      const [infra, dock, out] = await Promise.all([
        fetch(`${API}/api/infra/status`).then(r => r.json()).catch(() => ({})),
        fetch(`${API}/api/docker/containers`).then(r => r.json()).catch(() => []),
        fetch(`${API}/api/infra/outputs`).then(r => r.json()).catch(() => ({})),
      ]);
      setStatus(infra);
      setContainers(dock);
      setOutputs(out);
    } catch (e) {
      console.error("Refresh failed:", e);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <div>
            <h1 className="text-lg font-bold text-blue-400">DevOps Sandbox</h1>
            <p className="text-xs text-gray-400">Local AWS Training Platform</p>
          </div>
        </div>
        <nav className="flex gap-2">
          <NavItem label="Dashboard" active={page === "dashboard"} onClick={() => setPage("dashboard")} />
          <NavItem label="Infrastructure" active={page === "infra"} onClick={() => setPage("infra")} />
          <NavItem label="Logs" active={page === "logs"} onClick={() => setPage("logs")} />
        </nav>
        <button
          onClick={refresh}
          className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1.5 transition-colors"
        >
          ↻ Refresh
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 p-6">
        {page === "dashboard" && (
          <Dashboard status={status} containers={containers} outputs={outputs} api={API} />
        )}
        {page === "infra" && (
          <Infra status={status} outputs={outputs} api={API} onRefresh={refresh} />
        )}
        {page === "logs" && <Logs api={API} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 px-6 py-2 text-xs text-gray-500 flex justify-between">
        <span>DevOps Sandbox v1.0 · LocalStack Simulation</span>
        <span>LocalStack: <span className="text-green-400">http://localhost:4566</span></span>
      </footer>
    </div>
  );
}

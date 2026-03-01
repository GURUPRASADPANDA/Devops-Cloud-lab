import { useState } from "react";

function ActionButton({ label, icon, onClick, variant = "primary", disabled = false }) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-500 text-white",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function OutputTerminal({ output, loading }) {
  return (
    <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs text-green-300 border border-gray-700">
      {loading && (
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <span className="animate-spin">⟳</span>
          <span>Running...</span>
        </div>
      )}
      {output ? (
        <pre className="whitespace-pre-wrap">{output}</pre>
      ) : (
        <span className="text-gray-500">Output will appear here...</span>
      )}
    </div>
  );
}

export default function Infra({ api, onRefresh }) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAction(endpoint, method = "POST") {
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch(`${api}/api/infra/${endpoint}`, { method });
      const text = await res.text();
      setOutput(text);
      onRefresh();
    } catch (e) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDestroy() {
    if (!window.confirm("⚠️ This will destroy all provisioned resources. Continue?")) return;
    runAction("destroy");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Infrastructure Control</h2>
        <p className="text-sm text-gray-400">Manage Terraform and Ansible operations</p>
      </div>

      {/* Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Terraform */}
        <div className="bg-gray-800 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-gray-100">🔨 Terraform (IaC)</h3>
          <p className="text-sm text-gray-400">Provision VPC, EC2, S3, DynamoDB, and IAM resources on LocalStack.</p>
          <div className="flex flex-wrap gap-2">
            <ActionButton label="Plan" icon="📋" onClick={() => runAction("plan")} disabled={loading} variant="secondary" />
            <ActionButton label="Apply" icon="✅" onClick={() => runAction("apply")} disabled={loading} variant="success" />
            <ActionButton label="Destroy" icon="💥" onClick={confirmDestroy} disabled={loading} variant="danger" />
          </div>
        </div>

        {/* Ansible */}
        <div className="bg-gray-800 rounded-lg p-5 space-y-4">
          <h3 className="font-semibold text-gray-100">⚙️ Ansible (Config Management)</h3>
          <p className="text-sm text-gray-400">Configure the EC2 instance: install Nginx, Docker, and deploy the sample app.</p>
          <div className="flex flex-wrap gap-2">
            <ActionButton label="Configure" icon="▶️" onClick={() => runAction("configure")} disabled={loading} variant="primary" />
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-gray-800 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-200">📟 Output</h3>
          {output && (
            <button
              onClick={() => setOutput("")}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
        <OutputTerminal output={output} loading={loading} />
      </div>

      {/* Pipeline */}
      <div className="bg-gray-800 rounded-lg p-5">
        <h3 className="font-semibold text-gray-100 mb-3">🚀 Full Pipeline</h3>
        <p className="text-sm text-gray-400 mb-4">
          Run the complete DevOps workflow: <code className="text-blue-300">init → apply → configure → deploy</code>
        </p>
        <ActionButton
          label="Run Full Pipeline"
          icon="🚀"
          onClick={() => {
            setOutput("Running full pipeline — this may take a few minutes...\n");
            Promise.all([
              runAction("apply"),
            ]).then(() => runAction("configure"));
          }}
          disabled={loading}
          variant="primary"
        />
      </div>
    </div>
  );
}

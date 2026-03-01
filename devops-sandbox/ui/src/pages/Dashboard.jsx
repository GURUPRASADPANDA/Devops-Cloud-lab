function StatCard({ label, value, icon, color = "blue" }) {
  const colors = {
    blue: "border-blue-500 bg-blue-500/10",
    green: "border-green-500 bg-green-500/10",
    yellow: "border-yellow-500 bg-yellow-500/10",
    purple: "border-purple-500 bg-purple-500/10",
  };
  return (
    <div className={`border rounded-lg p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
    </div>
  );
}

function ContainerBadge({ container }) {
  const isRunning = container.state === "running";
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-400" : "bg-red-400"}`} />
        <span className="text-sm font-mono">{container.name}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded ${isRunning ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
        {container.status}
      </span>
    </div>
  );
}

function ResourceTable({ title, icon, items, columns }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="font-semibold text-gray-200 mb-3">{icon} {title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No resources provisioned</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                {columns.map(c => (
                  <th key={c.key} className="text-left py-1 px-2 text-gray-400 font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  {columns.map(c => (
                    <td key={c.key} className="py-1.5 px-2 font-mono text-xs text-gray-300">
                      {item[c.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ status, containers, outputs }) {
  const ec2Count = status?.ec2?.length ?? 0;
  const s3Count = status?.s3?.length ?? 0;
  const dbCount = status?.dynamodb?.length ?? 0;
  const runningContainers = containers.filter(c => c.state === "running").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Status Dashboard</h2>
        <p className="text-sm text-gray-400">Real-time overview of your local AWS simulation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="EC2 Instances" value={ec2Count} icon="🖥️" color="blue" />
        <StatCard label="S3 Buckets" value={s3Count} icon="🪣" color="green" />
        <StatCard label="DynamoDB Tables" value={dbCount} icon="🗄️" color="purple" />
        <StatCard label="Running Containers" value={runningContainers} icon="🐳" color="yellow" />
      </div>

      {/* Terraform Outputs */}
      {Object.keys(outputs).length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-gray-200 mb-3">📤 Terraform Outputs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(outputs).map(([k, v]) => (
              <div key={k} className="flex justify-between bg-gray-700/50 rounded px-3 py-1.5">
                <span className="text-xs text-gray-400 font-mono">{k}</span>
                <span className="text-xs text-green-300 font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ResourceTable
          title="EC2 Instances"
          icon="🖥️"
          items={status?.ec2 ?? []}
          columns={[
            { key: "id", label: "ID" },
            { key: "state", label: "State" },
            { key: "privateIp", label: "Private IP" },
          ]}
        />
        <ResourceTable
          title="S3 Buckets"
          icon="🪣"
          items={status?.s3 ?? []}
          columns={[
            { key: "name", label: "Name" },
          ]}
        />
        <ResourceTable
          title="DynamoDB Tables"
          icon="🗄️"
          items={status?.dynamodb ?? []}
          columns={[
            { key: "name", label: "Table Name" },
          ]}
        />
      </div>

      {/* Containers */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="font-semibold text-gray-200 mb-3">🐳 Containers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {containers.map(c => <ContainerBadge key={c.id} container={c} />)}
          {containers.length === 0 && (
            <p className="text-sm text-gray-500 italic">No sandbox containers found</p>
          )}
        </div>
      </div>
    </div>
  );
}

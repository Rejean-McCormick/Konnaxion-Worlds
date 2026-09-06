// frontend/features/ethikos/demo-importer/ImportResultPanel.tsx

import type { EthikosDemoImportResponse } from "./types";

type ImportResultPanelProps = {
  title: string;
  result: EthikosDemoImportResponse | null;
};

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        ok
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800",
      ].join(" ")}
    >
      {ok ? "Success" : "Error"}
    </span>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground">
      No result yet. Preview, import, or reset a scenario to see output here.
    </p>
  );
}

function SummaryGrid({
  summary,
}: {
  summary: EthikosDemoImportResponse["summary"];
}) {
  if (!summary) return null;

  const items = [
    ["Actors", summary.actors],
    ["Categories", summary.categories],
    ["Topics", summary.topics],
    ["Stances", summary.stances],
    ["Arguments", summary.arguments],
    ["Consultations", summary.consultations],
    ["Consultation votes", summary.consultation_votes],
    ["Impact items", summary.impact_items],
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border p-3">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      ))}
    </div>
  );
}

function ErrorList({
  errors,
}: {
  errors: NonNullable<EthikosDemoImportResponse["errors"]>;
}) {
  if (!errors.length) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-red-800">Validation errors</h3>

      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li
            key={`${error.path}-${index}`}
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm"
          >
            <div className="font-medium text-red-900">{error.path}</div>
            <div className="text-red-800">{error.message}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WarningList({
  warnings,
}: {
  warnings: NonNullable<EthikosDemoImportResponse["warnings"]>;
}) {
  if (!warnings.length) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-yellow-800">Warnings</h3>

      <ul className="space-y-2">
        {warnings.map((warning, index) => (
          <li
            key={index}
            className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900"
          >
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(warning, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ObjectList({
  title,
  objects,
}: {
  title: string;
  objects?: EthikosDemoImportResponse["created"];
}) {
  if (!objects?.length) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Label</th>
            </tr>
          </thead>

          <tbody>
            {objects.map((object, index) => (
              <tr key={`${title}-${object.object_type}-${object.object_id}-${index}`}>
                <td className="border-t px-3 py-2">{object.object_type}</td>
                <td className="border-t px-3 py-2">{object.object_id}</td>
                <td className="border-t px-3 py-2">
                  {object.object_label || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ImportResultPanel({ title, result }: ImportResultPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>

          {result?.scenario_key && (
            <p className="text-sm text-muted-foreground">
              Scenario:{" "}
              <span className="font-mono">{result.scenario_key}</span>
            </p>
          )}
        </div>

        {result && <StatusBadge ok={result.ok} />}
      </div>

      {!result ? (
        <EmptyState />
      ) : (
        <div className="space-y-5">
          {typeof result.dry_run === "boolean" && (
            <div className="rounded-md border p-3 text-sm">
              Mode:{" "}
              <span className="font-medium">
                {result.dry_run ? "Preview / dry run" : "Write operation"}
              </span>
            </div>
          )}

          <SummaryGrid summary={result.summary} />

          <ErrorList errors={result.errors ?? []} />
          <WarningList warnings={result.warnings ?? []} />

          <ObjectList title="Created" objects={result.created} />
          <ObjectList title="Updated" objects={result.updated} />
          <ObjectList title="Deleted" objects={result.deleted} />

          <details className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Raw response
            </summary>

            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </section>
  );
}
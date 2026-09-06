// FILE: frontend/modules/insights/components/UsageBigNumbers.tsx

type Item = { label: string; value: number };

export default function UsageBigNumbers({ items }: { items: Item[] }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {items.map((it) => (
        <div key={it.label} className="p-6 bg-white rounded shadow">
          <div className="text-3xl font-bold">{it.value.toLocaleString()}</div>
          <div className="text-gray-500">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

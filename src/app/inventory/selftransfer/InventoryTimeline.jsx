export default function InventoryTimeline({ ledger, onSelect }) {
    const transfers = Array.from(
        new Set(
            ledger
                .filter(l => l.movement_type === "SELF_TRANSFER")
                .map(l => l.reference)
        )
    );

    return (
        <div style={{ width: 280 }}>
            {transfers.map(ref => {
                const row = ledger.find(l => l.reference === ref);
                return (
                    <div
                        key={ref}
                        onClick={() => onSelect(ref)}
                        style={{
                            marginBottom: 16,
                            padding: 12,
                            borderRadius: "0 20px 20px 0",
                            background: "#111827",
                            borderLeft: "4px solid #6366f1",
                            cursor: "pointer"
                        }}
                    >
                        <div style={{ fontSize: 12, opacity: 0.6 }}>
                            {new Date(row.event_time).toLocaleString()}
                        </div>
                        <strong>{row.product_name}</strong>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{ref}</div>
                    </div>
                );
            })}
        </div>
    );
}

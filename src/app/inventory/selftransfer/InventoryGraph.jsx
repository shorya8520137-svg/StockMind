export default function InventoryGraph({ summary }) {
    return (
        <div
            style={{
                background: "#0b0e14",
                padding: 16,
                borderRadius: 12,
                marginBottom: 24
            }}
        >
            <h3>Inventory Flow</h3>
            <div style={{ display: "flex", gap: 24 }}>
                <span style={{ color: "#22c55e" }}>IN: {summary.total_in}</span>
                <span style={{ color: "#ef4444" }}>OUT: {summary.total_out}</span>
                <span style={{ color: "#8b5cf6" }}>NET: {summary.net}</span>
            </div>
        </div>
    );
}

export default function InventoryTable({ rows }) {
    return (
        <table style={{ width: "100%" }}>
            <thead>
            <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Qty</th>
                <th>Dir</th>
                <th>Ref</th>
            </tr>
            </thead>
            <tbody>
            {rows.map((r, i) => (
                <tr key={i}>
                    <td>{new Date(r.event_time).toLocaleString()}</td>
                    <td>{r.product_name}</td>
                    <td>{r.warehouse}</td>
                    <td>{r.qty}</td>
                    <td style={{ color: r.direction === "IN" ? "#22c55e" : "#ef4444" }}>
                        {r.direction}
                    </td>
                    <td>{r.reference}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

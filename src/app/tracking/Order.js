"use client";

import { useEffect, useState } from "react";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("https://api.hunyhuny.org/api/tracking/orders")
            .then(res => {
                if (!res.ok) throw new Error("API error");
                return res.json();
            })
            .then(data => {
                setOrders(data.orders || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load orders:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="orders-card">
            <h3>Orders</h3>

            {loading ? (
                <p>Loading orders...</p>
            ) : orders.length === 0 ? (
                <p>No orders found</p>
            ) : (
                <table className="orders-table">
                    <thead>
                    <tr>
                        <th>Order</th>
                        <th>Route</th>
                        <th>Weight</th>
                        <th>Status</th>
                    </tr>
                    </thead>

                    <tbody>
                    {orders.map((order, i) => (
                        <tr key={i}>
                            <td>{order.awb}</td>
                            <td>{order.route}</td>
                            <td>{order.weight} kg</td>
                            <td className={`status ${order.status?.toLowerCase().replace(/\s/g, "-")}`}>
                                {order.status}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

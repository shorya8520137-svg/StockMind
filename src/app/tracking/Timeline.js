"use client";

const timelineData = [
    {
        status: "Order Created",
        time: "01 Dec 2025 · 10:12 AM",
    },
    {
        status: "Picked Up",
        time: "01 Dec 2025 · 02:40 PM",
    },
    {
        status: "In Transit",
        time: "02 Dec 2025 · 09:15 AM",
    },
    {
        status: "Out for Delivery",
        time: "03 Dec 2025 · 08:30 AM",
    },
];

export default function Timeline() {
    return (
        <div className="timeline-card">
            <h3>Shipment Timeline</h3>

            <div className="timeline">
                {timelineData.map((item, index) => (
                    <div
                        key={index}
                        className={`timeline-item ${
                            index % 2 === 0 ? "left" : "right"
                        }`}
                    >
                        <div className="content">
                            <span className="status">{item.status}</span>
                            <span className="time">{item.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

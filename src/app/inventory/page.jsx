import InventorySheet from "./InventorySheet.jsx"

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function InventoryPage() {
    return (
        <div style={{ width: "100%", padding: "0px" }}>
            <InventorySheet />
        </div>
    )
}

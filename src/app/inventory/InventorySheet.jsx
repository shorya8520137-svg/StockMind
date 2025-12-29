"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import styles from "./inventory.module.css"
import { api } from "../../utils/api"

import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../../components/ui/table"

import ProductTracker from "./ProductTracker"

const PAGE_SIZE = 12

const ALL_WAREHOUSES = [
    "Gurgaon Warehouse",
    "Bangalore Warehouse",
    "Mumbai Warehouse",
    "Ahmedabad Warehouse",
    "Hyderabad Warehouse",
]

export default function InventorySheet() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    const [tokens, setTokens] = useState([])
    const [input, setInput] = useState("")
    const [suggestions, setSuggestions] = useState([])
    const [showSuggest, setShowSuggest] = useState(false)

    const [page, setPage] = useState(1)
    const inputRef = useRef(null)

    const [activeWarehouse, setActiveWarehouse] = useState("Gurgaon Warehouse")

    // PRODUCT TRACKER STATE
    const [openTracker, setOpenTracker] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)

    /* LOAD INVENTORY */
    useEffect(() => {
        setLoading(true)
        api(`/api/inventory/all?warehouse=${encodeURIComponent(activeWarehouse)}`)
            .then(data => {
                setItems(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(() => {
                setItems([])
                setLoading(false)
            })
    }, [activeWarehouse])

    /* SEARCH SUGGESTIONS */
    useEffect(() => {
        if (!input.trim()) {
            setShowSuggest(false)
            return
        }

        const q = input.toLowerCase()
        const merged = [
            ...items.map(i => i.product).filter(Boolean),
            ...ALL_WAREHOUSES,
        ].filter(v => v.toLowerCase().includes(q))

        setSuggestions([...new Set(merged)].slice(0, 8))
        setShowSuggest(true)
    }, [input, items])

    const addToken = (value) => {
        const v = value.trim()
        if (!v) return

        if (ALL_WAREHOUSES.includes(v)) {
            setActiveWarehouse(v)
            setTokens([v])
        } else if (!tokens.includes(v)) {
            setTokens([...tokens, v])
        }

        setInput("")
        setShowSuggest(false)
    }

    const filtered = useMemo(() => {
        if (!tokens.length) return items
        return items.filter(item =>
            tokens.every(t =>
                Object.values(item).some(v =>
                    String(v).toLowerCase().includes(t.toLowerCase())
                )
            )
        )
    }, [tokens, items])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    )

    return (
        <div className={styles.container}>

            {/* SEARCH */}
            <div className={styles.searchWrapper}>
                {tokens.map((t, i) => (
                    <span key={i} className={styles.chip}>
                        {t}
                        <button onClick={() => setTokens(tokens.filter(x => x !== t))}>×</button>
                    </span>
                ))}

                <input
                    ref={inputRef}
                    className={styles.searchInput}
                    value={input}
                    placeholder="Search product, warehouse, stock, return"
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addToken(input)}
                />

                {showSuggest && (
                    <ul className={styles.suggestionList}>
                        {suggestions.map((s, i) => (
                            <li key={i} onMouseDown={() => addToken(s)}>
                                {s}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* TABLE */}
            <div className={styles.tableWrapper}>
                <Table className={styles.table}>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Return</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {!loading && paginated.map((item, i) => (
                            <TableRow key={i}>
                                <TableCell>{item.product}</TableCell>

                                {/* CLICKABLE STOCK */}
                                <TableCell>
                                    <button
                                        className={styles.stockBtn}
                                        onClick={() => {
                                            setSelectedProduct(item)
                                            setOpenTracker(true)
                                        }}
                                    >
                                        {item.stock}
                                    </button>
                                </TableCell>

                                <TableCell>{item.warehouse}</TableCell>
                                <TableCell>{item.created_at}</TableCell>
                                <TableCell />
                                <TableCell>{item.return || 0}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* PRODUCT TRACKER POPUP */}
            {openTracker && selectedProduct && (
                <ProductTracker
                    barcodeOverride={selectedProduct.code}
                    warehouseFilter={activeWarehouse}
                    onClose={() => setOpenTracker(false)}
                />
            )}

        </div>
    )
}

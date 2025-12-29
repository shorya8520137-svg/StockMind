"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./chatui.module.css";

const SPINNER_FRAMES = ["|", "/", "-", "\\"];

export default function ChatUI() {
    const [open, setOpen] = useState(true);
    const [input, setInput] = useState("");
    const [lines, setLines] = useState([
        { type: "system", text: "Amigo Orders AI v1.0" },
        { type: "system", text: "Type your query below and press Enter." },
        { type: "bot", text: "Hi! I'm Amigo. Ask me anything about your orders." },
    ]);

    const [loading, setLoading] = useState(false);
    const [spinnerIndex, setSpinnerIndex] = useState(0);

    const bottomRef = useRef(null);

    // Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [lines, loading, spinnerIndex]);

    // Spinner animation
    useEffect(() => {
        if (!loading) return;

        const interval = setInterval(() => {
            setSpinnerIndex(i => (i + 1) % SPINNER_FRAMES.length);
        }, 120);

        return () => clearInterval(interval);
    }, [loading]);

    // SEND MESSAGE TO BACKEND
    const sendMessage = async () => {
        if (!input.trim()) return;

        const question = input;

        setLines(prev => [
            ...prev,
            { type: "user", text: question },
        ]);

        setInput("");
        setLoading(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/chatgpt`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message: question }),
                }
            );

            const data = await res.json();

            setLoading(false);

            setLines(prev => [
                ...prev,
                {
                    type: "bot",
                    text: data?.success
                        ? data.reply
                        : "❌ Error processing request",
                },
            ]);
        } catch (error) {
            console.error(error);
            setLoading(false);

            setLines(prev => [
                ...prev,
                {
                    type: "bot",
                    text: "❌ Unable to connect to server",
                },
            ]);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <div className={styles.fab} onClick={() => setOpen(o => !o)}>
                🤖
            </div>

            {open && (
                <div className={styles.terminal}>
                    {/* Header */}
                    <div className={styles.header}>
                        Amigo · Orders AI
                    </div>

                    {/* Output */}
                    <div className={styles.output}>
                        {lines.map((line, i) => (
                            <div
                                key={i}
                                className={`${styles.line} ${styles[line.type]}`}
                            >
                                {line.type === "user" && (
                                    <span className={styles.prompt}>$</span>
                                )}
                                {line.text}
                            </div>
                        ))}

                        {/* Spinner */}
                        {loading && (
                            <div className={`${styles.line} ${styles.bot}`}>
                                {SPINNER_FRAMES[spinnerIndex]}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className={styles.inputRow}>
                        <span className={styles.prompt}>$</span>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === "Enter" && sendMessage()
                            }
                            placeholder="ask-orders --awb 123456"
                        />
                    </div>
                </div>
            )}
        </>
    );
}

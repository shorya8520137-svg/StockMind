"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./semiDial.module.css";

export default function PetAssistant({ onCommand }) {
    const [open, setOpen] = useState(false);
    const [speech, setSpeech] = useState("Running away already?");
    const [reaction, setReaction] = useState("idle");

    function handleCommand(e) {
        if (e.key === "Enter") {
            const cmd = e.target.value.toLowerCase().trim();

            if (cmd.includes("transfer")) {
                setSpeech("Opening self transfer 🚚");
                setReaction("happy");
                onCommand?.("TRANSFER_SELF");
            }
            else if (
                cmd.includes("stock") ||
                cmd.includes("inventory") ||
                cmd.includes("bulk")
            ) {
                setSpeech("Opening inventory entry 📦");
                setReaction("happy");
                onCommand?.("INVENTORY_ENTRY");
            }
            else if (cmd.includes("damage")) {
                setSpeech("Opening damage panel 💥");
                setReaction("shake");
                onCommand?.("DAMAGE_RECOVERY");
            }
            else if (cmd.includes("recover")) {
                setSpeech("Opening recovery panel ♻️");
                setReaction("happy");
                onCommand?.("DAMAGE_RECOVERY");
            }
            // ✅ RETURN COMMAND (FINAL)
            else if (cmd.includes("return")) {
                setSpeech("Opening return panel ↩️");
                setReaction("tilt");
                onCommand?.("RETURN_ENTRY");
            }
            else {
                setSpeech("Hmm…");
                setReaction("idle");
            }

            e.target.value = "";
            setTimeout(() => setReaction("idle"), 800);
        }
    }

    return (
        <>
            <div
                className={styles.edgeHandle}
                onClick={() => setOpen(v => !v)}
            />

            <AnimatePresence>
                {open && (
                    <motion.div
                        className={styles.petWrapper}
                        initial={{ x: 120, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 120, opacity: 0 }}
                    >
                        <motion.div
                            className={styles.pet}
                            animate={
                                reaction === "shake"
                                    ? { x: [-4, 4, -4, 4, 0] }
                                    : reaction === "tilt"
                                        ? { rotate: [0, -10, 10, 0] }
                                        : reaction === "happy"
                                            ? { scale: [1, 1.15, 1] }
                                            : { y: [0, -6, 0] }
                            }
                            transition={{
                                duration: reaction === "idle" ? 2.2 : 0.4,
                                repeat: reaction === "idle" ? Infinity : 0,
                                ease: "easeInOut",
                            }}
                        >
                            <motion.div className={styles.eyeLeft} />
                            <motion.div className={styles.eyeRight} />
                        </motion.div>

                        <div className={styles.content}>
                            <motion.div className={styles.speechBubble}>
                                {speech}
                            </motion.div>

                            <input
                                className={styles.commandInput}
                                placeholder="Type command… (damage / recover / return)"
                                onKeyDown={handleCommand}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

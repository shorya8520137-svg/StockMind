"use client";

import { Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import styles from "./themeToggle.module.css";

export default function ThemeToggle() {
    const { theme } = useTheme();

    return (
        <div className={styles.toggle}>
            <div className={styles.iconWrapper}>
                <Sun className={styles.icon} size={18} />
            </div>
            <span className={styles.label}>
                Light Mode
            </span>
        </div>
    );
}



'use client';

import React from 'react';
import StoreInventory from './store';
import styles from './store.module.css';

export default function Page() {
    return (
        <div className={styles.container}>
            <StoreInventory />
        </div>
    );
}

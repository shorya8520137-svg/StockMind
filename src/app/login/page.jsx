"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./login.module.css";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
    const [isTyping, setIsTyping] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [characterEmotion, setCharacterEmotion] = useState("happy"); // happy, typing, error, success, sleepy
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const { login, availableUsers } = useAuth();
    const router = useRouter();
    const containerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Track mouse movement for character animation
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setMousePosition({ x, y });
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            return () => container.removeEventListener('mousemove', handleMouseMove);
        }
    }, []);

    // Handle typing animation
    const handleInputChange = (setter, value) => {
        setter(value);
        setIsTyping(true);
        setCharacterEmotion("typing");
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing animation
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            setCharacterEmotion("happy");
        }, 1000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        setCharacterEmotion("loading");

        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = login(email, password);

        if (result.success) {
            setCharacterEmotion("success");
            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } else {
            setCharacterEmotion("error");
            setError(result.error || "Invalid credentials");
            setLoading(false);
            
            // Reset to happy after error animation
            setTimeout(() => {
                setCharacterEmotion("happy");
            }, 3000);
        }
    };

    // Auto-hide character emotion after some time
    useEffect(() => {
        if (characterEmotion === "error" || characterEmotion === "success") {
            const timer = setTimeout(() => {
                setCharacterEmotion("happy");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [characterEmotion]);

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Animated Background Elements */}
            <div className={styles.backgroundShapes}>
                <div className={styles.shape1}></div>
                <div className={styles.shape2}></div>
                <div className={styles.shape3}></div>
            </div>

            {/* Interactive Character Section */}
            <div className={styles.characterSection}>
                <div className={styles.characterContainer}>
                    {/* Character Body */}
                    <div className={`${styles.character} ${styles[characterEmotion]}`}>
                        <div className={styles.characterHead}>
                            {/* Eyes that follow mouse and show emotions */}
                            <div 
                                className={`${styles.characterEyes} ${styles[`eyes_${characterEmotion}`]}`}
                                style={{
                                    transform: isPasswordFocused 
                                        ? 'translate(0px, 0px)' 
                                        : `translate(${(mousePosition.x - 50) * 0.15}px, ${(mousePosition.y - 50) * 0.08}px)`
                                }}
                            >
                                <div className={`${styles.eye} ${styles.leftEye}`}>
                                    <div className={styles.pupil}></div>
                                    <div className={styles.eyeShine}></div>
                                </div>
                                <div className={`${styles.eye} ${styles.rightEye}`}>
                                    <div className={styles.pupil}></div>
                                    <div className={styles.eyeShine}></div>
                                </div>
                            </div>
                            
                            {/* Eyebrows for expressions */}
                            <div className={`${styles.eyebrows} ${styles[`eyebrows_${characterEmotion}`]}`}>
                                <div className={styles.leftEyebrow}></div>
                                <div className={styles.rightEyebrow}></div>
                            </div>
                            
                            {/* Dynamic mouth based on emotion */}
                            <div className={`${styles.characterMouth} ${styles[`mouth_${characterEmotion}`]}`}></div>
                            
                            {/* Blush for different emotions */}
                            {(characterEmotion === "error" || characterEmotion === "typing") && (
                                <div className={styles.blush}>
                                    <div className={styles.leftBlush}></div>
                                    <div className={styles.rightBlush}></div>
                                </div>
                            )}
                        </div>
                        
                        <div className={styles.characterBody}>
                            <div 
                                className={`${styles.characterArm} ${styles.leftArm}`} 
                                style={{
                                    transform: `rotate(${(mousePosition.x - 50) * 0.3}deg)`
                                }}
                            ></div>
                            <div 
                                className={`${styles.characterArm} ${styles.rightArm}`} 
                                style={{
                                    transform: `rotate(${-(mousePosition.x - 50) * 0.3}deg)`
                                }}
                            ></div>
                        </div>
                    </div>

                    {/* Activity Elements */}
                    <div className={styles.activityElements}>
                        <div className={styles.laptop}>
                            <div className={styles.laptopScreen}>
                                {isTyping && <div className={styles.typingIndicator}>...</div>}
                            </div>
                            <div className={styles.laptopKeyboard}></div>
                        </div>
                        <div className={styles.floatingIcons}>
                            <div className={styles.icon}>📊</div>
                            <div className={styles.icon}>📈</div>
                            <div className={styles.icon}>💼</div>
                        </div>
                    </div>

                    {/* Emotion particles */}
                    {characterEmotion === "success" && (
                        <div className={styles.successParticles}>
                            <div className={styles.particle}>🎉</div>
                            <div className={styles.particle}>✨</div>
                            <div className={styles.particle}>🎊</div>
                        </div>
                    )}
                    
                    {characterEmotion === "error" && (
                        <div className={styles.errorParticles}>
                            <div className={styles.particle}>😵</div>
                            <div className={styles.particle}>💫</div>
                        </div>
                    )}
                </div>

                <div className={styles.welcomeText}>
                    <h2>Welcome to Your Workspace</h2>
                    <p>Manage your business with ease</p>
                </div>
            </div>

            {/* Login Form Section */}
            <div className={styles.loginSection}>
                <div className={styles.loginCard}>
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <div className={styles.logoIcon}>A</div>
                            <span className={styles.logoText}>Amigo Orders</span>
                        </div>
                        <h1 className={styles.title}>Welcome back</h1>
                        <p className={styles.subtitle}>
                            Login to your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.errorMessage}>
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email</label>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => handleInputChange(setEmail, e.target.value)}
                                required
                                autoFocus
                                onFocus={() => {
                                    setCharacterEmotion("typing");
                                    setIsPasswordFocused(false);
                                }}
                                onBlur={() => {
                                    setTimeout(() => setCharacterEmotion("happy"), 500);
                                }}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelRow}>
                                <label className={styles.label}>Password</label>
                                <a href="#" className={styles.forgotLink}>Forgot your password?</a>
                            </div>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => handleInputChange(setPassword, e.target.value)}
                                required
                                onFocus={() => {
                                    setCharacterEmotion("sleepy");
                                    setIsPasswordFocused(true);
                                }}
                                onBlur={() => {
                                    setIsPasswordFocused(false);
                                    setTimeout(() => setCharacterEmotion("happy"), 500);
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`${styles.submitBtn} ${loading ? styles.loading : ""}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    Signing in...
                                </>
                            ) : (
                                "Login"
                            )}
                        </button>

                        <div className={styles.footer}>
                            <button
                                type="button"
                                className={styles.credentialsBtn}
                                onClick={() => setShowCredentials(!showCredentials)}
                            >
                                {showCredentials ? "Hide" : "Show"} Demo Credentials
                            </button>
                            
                            {showCredentials && (
                                <div className={styles.credentialsPanel}>
                                    <h4 className={styles.credentialsTitle}>Demo Users</h4>
                                    <div className={styles.usersList}>
                                        {availableUsers.map((user) => (
                                            <div key={user.email} className={styles.userCard}>
                                                <div className={styles.userInfo}>
                                                    <strong>{user.name}</strong>
                                                    <span className={styles.userRole}>{user.role.replace('_', ' ')}</span>
                                                    <span className={styles.userEmail}>{user.email}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={styles.selectUserBtn}
                                                    onClick={() => {
                                                        setEmail(user.email);
                                                        setPassword(user.email.includes('admin') ? 'admin@123' : 
                                                                   user.email.includes('manager') ? 'manager@123' :
                                                                   user.email.includes('operator') ? 'operator@123' :
                                                                   user.email.includes('warehouse') ? 'warehouse@123' : 'viewer@123');
                                                        setCharacterEmotion("happy");
                                                    }}
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.credentialsNote}>
                                        <small>All passwords follow the pattern: [role]@123</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}


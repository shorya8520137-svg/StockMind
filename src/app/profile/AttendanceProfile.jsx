"use client";

import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    Calendar, 
    MapPin, 
    User, 
    Settings, 
    FileText, 
    AlertCircle, 
    CheckCircle, 
    XCircle,
    Timer,
    Coffee,
    LogIn,
    LogOut,
    Edit,
    Send,
    BarChart3,
    TrendingUp,
    Award,
    Target
} from 'lucide-react';
import styles from './profile.module.css';

const AttendanceProfile = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isPunchedIn, setIsPunchedIn] = useState(false);
    const [todayPunchIn, setTodayPunchIn] = useState(null);
    const [todayPunchOut, setTodayPunchOut] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showRegularizationModal, setShowRegularizationModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [regularizationReason, setRegularizationReason] = useState('');
    const [location, setLocation] = useState('Fetching location...');

    // Mock data for demonstration
    const [attendanceData, setAttendanceData] = useState({
        currentMonth: {
            present: 18,
            absent: 2,
            halfDay: 1,
            late: 3,
            workingDays: 22,
            totalHours: 162.5
        },
        recentPunches: [
            { date: '2025-01-06', punchIn: '09:15', punchOut: '18:30', status: 'present', hours: 8.25 },
            { date: '2025-01-05', punchIn: '09:45', punchOut: '18:15', status: 'late', hours: 7.5 },
            { date: '2025-01-04', punchIn: '09:00', punchOut: '18:00', status: 'present', hours: 8.0 },
            { date: '2025-01-03', punchIn: '09:30', punchOut: '13:00', status: 'half-day', hours: 3.5 },
        ],
        regularizations: [
            { date: '2025-01-02', reason: 'Medical appointment', status: 'approved', type: 'late-in' },
            { date: '2024-12-28', reason: 'Traffic jam due to rain', status: 'pending', type: 'late-in' },
            { date: '2024-12-25', reason: 'Forgot to punch out', status: 'rejected', type: 'missing-out' },
        ]
    });

    // Generate heatmap data for the last 3 months
    const generateHeatmapData = () => {
        const data = [];
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
                const random = Math.random();
                let status = 'present';
                let intensity = 4;
                
                if (random < 0.05) {
                    status = 'absent';
                    intensity = 0;
                } else if (random < 0.1) {
                    status = 'half-day';
                    intensity = 2;
                } else if (random < 0.2) {
                    status = 'late';
                    intensity = 3;
                }
                
                data.push({
                    date: new Date(d),
                    status,
                    intensity,
                    hours: status === 'absent' ? 0 : status === 'half-day' ? 4 : Math.random() * 2 + 7
                });
            }
        }
        return data;
    };

    const [heatmapData] = useState(generateHeatmapData());

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                },
                () => {
                    setLocation('Location access denied');
                }
            );
        }

        return () => clearInterval(timer);
    }, []);

    const handlePunchIn = () => {
        const now = new Date();
        setTodayPunchIn(now.toLocaleTimeString('en-US', { hour12: false }));
        setIsPunchedIn(true);
    };

    const handlePunchOut = () => {
        const now = new Date();
        setTodayPunchOut(now.toLocaleTimeString('en-US', { hour12: false }));
        setIsPunchedIn(false);
    };

    const handleRegularization = (date) => {
        setSelectedDate(date);
        setShowRegularizationModal(true);
    };

    const submitRegularization = () => {
        // Add regularization logic here
        setShowRegularizationModal(false);
        setRegularizationReason('');
        setSelectedDate(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return '#10b981';
            case 'late': return '#f59e0b';
            case 'half-day': return '#3b82f6';
            case 'absent': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIntensity = (intensity) => {
        const baseColor = '#10b981';
        const opacities = [0, 0.2, 0.4, 0.6, 0.8, 1];
        return `${baseColor}${Math.round(opacities[intensity] * 255).toString(16).padStart(2, '0')}`;
    };

    const renderHeatmap = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Generate weeks for the month
        const weeks = [];
        let currentWeek = [];
        let dayCount = 1;
        
        // Fill first week (may have empty days from previous month)
        const startingDayOfWeek = firstDay.getDay();
        for (let i = 0; i < startingDayOfWeek; i++) {
            currentWeek.push({ isEmpty: true, key: `empty-start-${i}` });
        }
        
        // Add days of the month
        while (dayCount <= daysInMonth) {
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            
            const date = new Date(currentYear, currentMonth, dayCount);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = date.toDateString() === today.toDateString();
            
            // Mock attendance status
            let status = 'present';
            let hours = 8.0;
            
            if (isWeekend) {
                status = 'weekend';
                hours = 0;
            } else if (Math.random() < 0.05) {
                status = 'absent';
                hours = 0;
            } else if (Math.random() < 0.1) {
                status = 'late';
                hours = 7.5;
            } else if (Math.random() < 0.05) {
                status = 'halfDay';
                hours = 4.0;
            }
            
            currentWeek.push({
                day: dayCount,
                date,
                status,
                hours,
                isToday,
                isWeekend,
                key: `day-${dayCount}`
            });
            
            dayCount++;
        }
        
        // Fill last week if needed
        while (currentWeek.length < 7) {
            currentWeek.push({ isEmpty: true, key: `empty-end-${currentWeek.length}` });
        }
        weeks.push(currentWeek);
        
        // Calculate summary stats
        const allDays = weeks.flat().filter(d => !d.isEmpty);
        const workingDays = allDays.filter(d => !d.isWeekend);
        const presentDays = workingDays.filter(d => d.status === 'present').length;
        const absentDays = workingDays.filter(d => d.status === 'absent').length;
        const lateDays = workingDays.filter(d => d.status === 'late').length;
        const totalHours = workingDays.reduce((sum, d) => sum + (d.hours || 0), 0);
        
        return (
            <div className={styles.heatmapContainer}>
                <div className={styles.heatmapHeader}>
                    <h3>Attendance Overview</h3>
                    <div className={styles.heatmapControls}>
                        <select className={styles.monthSelector}>
                            <option>Jan 2025</option>
                            <option>Dec 2024</option>
                            <option>Nov 2024</option>
                        </select>
                        <div className={styles.heatmapLegend}>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ backgroundColor: '#dcfce7' }} />
                                <span>Present</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ backgroundColor: '#fef3c7' }} />
                                <span>Late</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ backgroundColor: '#fee2e2' }} />
                                <span>Absent</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className={styles.compactCalendar}>
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className={styles.weekRow}>
                            <div className={styles.weekLabel}>
                                W{weekIndex + 1}
                            </div>
                            {week.map(dayData => {
                                if (dayData.isEmpty) {
                                    return <div key={dayData.key} className={`${styles.dayCell} ${styles.empty}`} />;
                                }
                                
                                const classNames = [
                                    styles.dayCell,
                                    styles[dayData.status],
                                    dayData.isToday ? styles.today : ''
                                ].filter(Boolean).join(' ');
                                
                                return (
                                    <div
                                        key={dayData.key}
                                        className={classNames}
                                        onClick={() => !dayData.isWeekend && handleRegularization(dayData.date)}
                                    >
                                        {dayData.day}
                                        <div className={styles.dayTooltip}>
                                            {dayData.date.toLocaleDateString('en-US', { 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                            <br />
                                            {dayData.status.charAt(0).toUpperCase() + dayData.status.slice(1)}
                                            {dayData.hours > 0 && <><br />{dayData.hours}h</>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                
                <div className={styles.monthSummary}>
                    <div className={styles.summaryItem}>
                        <div className={styles.summaryValue}>{presentDays}</div>
                        <div className={styles.summaryLabel}>Present</div>
                    </div>
                    <div className={styles.summaryItem}>
                        <div className={styles.summaryValue}>{absentDays}</div>
                        <div className={styles.summaryLabel}>Absent</div>
                    </div>
                    <div className={styles.summaryItem}>
                        <div className={styles.summaryValue}>{lateDays}</div>
                        <div className={styles.summaryLabel}>Late</div>
                    </div>
                    <div className={styles.summaryItem}>
                        <div className={styles.summaryValue}>{totalHours.toFixed(0)}h</div>
                        <div className={styles.summaryLabel}>Hours</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        <User size={24} />
                    </div>
                    <div className={styles.userDetails}>
                        <h2>John Doe</h2>
                        <p>Software Engineer • EMP001</p>
                        <div className={styles.location}>
                            <MapPin size={14} />
                            <span>{location}</span>
                        </div>
                    </div>
                </div>
                
                <div className={styles.currentTime}>
                    <div className={styles.timeDisplay}>
                        {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                    </div>
                    <div className={styles.dateDisplay}>
                        {currentTime.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabNavigation}>
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { id: 'attendance', label: 'Attendance', icon: Calendar },
                    { id: 'regularization', label: 'Regularization', icon: FileText },
                    { id: 'reports', label: 'Reports', icon: TrendingUp }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className={styles.content}>
                {activeTab === 'dashboard' && (
                    <div className={styles.dashboard}>
                        {/* Main Content */}
                        <div className={styles.mainContent}>
                            {/* Hero Section */}
                            <div className={styles.heroSection}>
                                <div className={styles.heroContent}>
                                    <h1 className={styles.welcomeText}>Good Morning, John!</h1>
                                    <p className={styles.heroSubtext}>Ready to make today productive?</p>
                                    
                                    <div className={styles.punchSection}>
                                        <div className={styles.punchStatus}>
                                            <div className={styles.statusIndicator}>
                                                {isPunchedIn ? <LogIn size={20} /> : <LogOut size={20} />}
                                            </div>
                                            <div className={styles.statusText}>
                                                <h3>{isPunchedIn ? 'Punched In' : 'Ready to Start'}</h3>
                                                <p>{isPunchedIn ? 'You are currently working' : 'Start your productive day'}</p>
                                            </div>
                                        </div>
                                        
                                        <button
                                            className={styles.punchButton}
                                            onClick={isPunchedIn ? handlePunchOut : handlePunchIn}
                                        >
                                            {isPunchedIn ? (
                                                <>
                                                    <LogOut size={16} />
                                                    Punch Out
                                                </>
                                            ) : (
                                                <>
                                                    <LogIn size={16} />
                                                    Punch In
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className={styles.punchTimes}>
                                        <div className={styles.punchTime}>
                                            <span className={styles.label}>Punch In</span>
                                            <span className={styles.time}>{todayPunchIn || '--:--'}</span>
                                        </div>
                                        <div className={styles.punchTime}>
                                            <span className={styles.label}>Punch Out</span>
                                            <span className={styles.time}>{todayPunchOut || '--:--'}</span>
                                        </div>
                                        <div className={styles.punchTime}>
                                            <span className={styles.label}>Total Hours</span>
                                            <span className={styles.time}>8:30</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Overview */}
                            <div className={styles.statsOverview}>
                                <div className={styles.statCard} style={{'--accent-color': '#10b981'}}>
                                    <div className={styles.statHeader}>
                                        <div className={styles.statIcon}>
                                            <CheckCircle size={20} />
                                        </div>
                                        <div className={styles.statTrend}>
                                            <TrendingUp size={12} />
                                            +5.2%
                                        </div>
                                    </div>
                                    <div className={styles.statValue}>{attendanceData.currentMonth.present}</div>
                                    <div className={styles.statLabel}>Present Days</div>
                                </div>
                                
                                <div className={styles.statCard} style={{'--accent-color': '#ef4444'}}>
                                    <div className={styles.statHeader}>
                                        <div className={styles.statIcon}>
                                            <XCircle size={20} />
                                        </div>
                                        <div className={styles.statTrend}>
                                            <TrendingUp size={12} />
                                            -2.1%
                                        </div>
                                    </div>
                                    <div className={styles.statValue}>{attendanceData.currentMonth.absent}</div>
                                    <div className={styles.statLabel}>Absent Days</div>
                                </div>
                                
                                <div className={styles.statCard} style={{'--accent-color': '#f59e0b'}}>
                                    <div className={styles.statHeader}>
                                        <div className={styles.statIcon}>
                                            <Clock size={20} />
                                        </div>
                                        <div className={styles.statTrend}>
                                            <TrendingUp size={12} />
                                            +1.8%
                                        </div>
                                    </div>
                                    <div className={styles.statValue}>{attendanceData.currentMonth.late}</div>
                                    <div className={styles.statLabel}>Late Arrivals</div>
                                </div>
                                
                                <div className={styles.statCard} style={{'--accent-color': '#3b82f6'}}>
                                    <div className={styles.statHeader}>
                                        <div className={styles.statIcon}>
                                            <Timer size={20} />
                                        </div>
                                        <div className={styles.statTrend}>
                                            <TrendingUp size={12} />
                                            +12.5%
                                        </div>
                                    </div>
                                    <div className={styles.statValue}>{attendanceData.currentMonth.totalHours}h</div>
                                    <div className={styles.statLabel}>Total Hours</div>
                                </div>
                            </div>

                            {/* Quick Actions Panel */}
                            <div className={styles.quickActionsPanel}>
                                <div className={styles.panelHeader}>
                                    <h3 className={styles.panelTitle}>Quick Actions</h3>
                                </div>
                                <div className={styles.actionGrid}>
                                    <button 
                                        className={styles.actionButton}
                                        onClick={() => setShowRegularizationModal(true)}
                                    >
                                        <div className={styles.actionIcon}>
                                            <FileText size={16} />
                                        </div>
                                        <span>Request Regularization</span>
                                    </button>
                                    <button 
                                        className={styles.actionButton}
                                        onClick={() => setActiveTab('attendance')}
                                    >
                                        <div className={styles.actionIcon}>
                                            <Calendar size={16} />
                                        </div>
                                        <span>View Attendance</span>
                                    </button>
                                    <button 
                                        className={styles.actionButton}
                                        onClick={() => setActiveTab('reports')}
                                    >
                                        <div className={styles.actionIcon}>
                                            <BarChart3 size={16} />
                                        </div>
                                        <span>Download Reports</span>
                                    </button>
                                    <button 
                                        className={styles.actionButton}
                                        onClick={() => alert('Apply for leave')}
                                    >
                                        <div className={styles.actionIcon}>
                                            <Coffee size={16} />
                                        </div>
                                        <span>Apply Leave</span>
                                    </button>
                                </div>
                            </div>

                            {/* Heatmap */}
                            {renderHeatmap()}
                        </div>

                        {/* Sidebar */}
                        <div className={styles.sidebar}>
                            {/* Leave Balance */}
                            <div className={styles.leaveBalance}>
                                <h3>
                                    <Coffee size={16} />
                                    Leave Balance
                                </h3>
                                <div className={styles.leaveTypes}>
                                    <div className={styles.leaveType}>
                                        <div className={styles.leaveInfo}>
                                            <div className={styles.leaveIcon} style={{background: '#10b981'}}>
                                                <Coffee size={12} />
                                            </div>
                                            <span className={styles.leaveName}>Annual Leave</span>
                                        </div>
                                        <div className={styles.leaveCount}>
                                            <span className={styles.available}>12</span>
                                            <span className={styles.total}>/20</span>
                                        </div>
                                    </div>
                                    <div className={styles.leaveType}>
                                        <div className={styles.leaveInfo}>
                                            <div className={styles.leaveIcon} style={{background: '#ef4444'}}>
                                                <AlertCircle size={12} />
                                            </div>
                                            <span className={styles.leaveName}>Sick Leave</span>
                                        </div>
                                        <div className={styles.leaveCount}>
                                            <span className={styles.available}>8</span>
                                            <span className={styles.total}>/10</span>
                                        </div>
                                    </div>
                                    <div className={styles.leaveType}>
                                        <div className={styles.leaveInfo}>
                                            <div className={styles.leaveIcon} style={{background: '#f59e0b'}}>
                                                <User size={12} />
                                            </div>
                                            <span className={styles.leaveName}>Personal Leave</span>
                                        </div>
                                        <div className={styles.leaveCount}>
                                            <span className={styles.available}>3</span>
                                            <span className={styles.total}>/5</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Birthday Widget */}
                            <div className={styles.birthdayWidget}>
                                <h3>
                                    <Award size={16} />
                                    Upcoming Birthdays
                                </h3>
                                <div className={styles.birthdayList}>
                                    <div className={styles.birthdayItem}>
                                        <div className={styles.birthdayAvatar}>
                                            SM
                                        </div>
                                        <div className={styles.birthdayInfo}>
                                            <p className={styles.birthdayName}>Sarah Miller</p>
                                            <p className={styles.birthdayDate}>Today</p>
                                        </div>
                                        <div className={styles.birthdayIcon}>
                                            <Award size={16} />
                                        </div>
                                    </div>
                                    <div className={styles.birthdayItem}>
                                        <div className={styles.birthdayAvatar}>
                                            RJ
                                        </div>
                                        <div className={styles.birthdayInfo}>
                                            <p className={styles.birthdayName}>Robert Johnson</p>
                                            <p className={styles.birthdayDate}>Tomorrow</p>
                                        </div>
                                        <div className={styles.birthdayIcon}>
                                            <Award size={16} />
                                        </div>
                                    </div>
                                    <div className={styles.birthdayItem}>
                                        <div className={styles.birthdayAvatar}>
                                            AL
                                        </div>
                                        <div className={styles.birthdayInfo}>
                                            <p className={styles.birthdayName}>Anna Lee</p>
                                            <p className={styles.birthdayDate}>Jan 8</p>
                                        </div>
                                        <div className={styles.birthdayIcon}>
                                            <Award size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Time Tracking */}
                            <div className={styles.timeTracking}>
                                <h3>Today's Time</h3>
                                <div className={styles.timeEntries}>
                                    <div className={styles.timeEntry}>
                                        <span className={styles.timeLabel}>First In</span>
                                        <span className={styles.timeValue}>09:15</span>
                                    </div>
                                    <div className={styles.timeEntry}>
                                        <span className={styles.timeLabel}>Last Out</span>
                                        <span className={styles.timeValue}>--:--</span>
                                    </div>
                                    <div className={styles.timeEntry}>
                                        <span className={styles.timeLabel}>Break Time</span>
                                        <span className={styles.timeValue}>1:00</span>
                                    </div>
                                    <div className={styles.timeEntry}>
                                        <span className={styles.timeLabel}>Productive</span>
                                        <span className={styles.timeValue}>7:30</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className={styles.recentActivity}>
                                <h3>Recent Activity</h3>
                                <div className={styles.activityList}>
                                    <div className={styles.activityItem}>
                                        <div className={styles.activityIcon} style={{background: '#10b981'}}>
                                            <LogIn size={14} />
                                        </div>
                                        <div className={styles.activityContent}>
                                            <p className={styles.activityText}>Punched in for the day</p>
                                            <p className={styles.activityTime}>2 hours ago</p>
                                        </div>
                                    </div>
                                    <div className={styles.activityItem}>
                                        <div className={styles.activityIcon} style={{background: '#3b82f6'}}>
                                            <FileText size={14} />
                                        </div>
                                        <div className={styles.activityContent}>
                                            <p className={styles.activityText}>Regularization approved</p>
                                            <p className={styles.activityTime}>Yesterday</p>
                                        </div>
                                    </div>
                                    <div className={styles.activityItem}>
                                        <div className={styles.activityIcon} style={{background: '#f59e0b'}}>
                                            <Coffee size={14} />
                                        </div>
                                        <div className={styles.activityContent}>
                                            <p className={styles.activityText}>Leave request submitted</p>
                                            <p className={styles.activityTime}>2 days ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className={styles.attendanceTab}>
                        <div className={styles.attendanceHeader}>
                            <h3>Recent Attendance</h3>
                            <div className={styles.attendanceFilters}>
                                <select className={styles.monthFilter}>
                                    <option>January 2025</option>
                                    <option>December 2024</option>
                                    <option>November 2024</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className={styles.attendanceList}>
                            {attendanceData.recentPunches.map((record, index) => (
                                <div key={index} className={styles.attendanceRecord}>
                                    <div className={styles.recordDate}>
                                        <Calendar size={16} />
                                        <span>{new Date(record.date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}</span>
                                    </div>
                                    
                                    <div className={styles.recordTimes}>
                                        <div className={styles.timeEntry}>
                                            <LogIn size={14} />
                                            <span>{record.punchIn}</span>
                                        </div>
                                        <div className={styles.timeEntry}>
                                            <LogOut size={14} />
                                            <span>{record.punchOut}</span>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.recordHours}>
                                        <Timer size={14} />
                                        <span>{record.hours}h</span>
                                    </div>
                                    
                                    <div className={`${styles.recordStatus} ${styles[record.status]}`}>
                                        {record.status.replace('-', ' ')}
                                    </div>
                                    
                                    <button 
                                        className={styles.regularizeButton}
                                        onClick={() => handleRegularization(new Date(record.date))}
                                    >
                                        <Edit size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'regularization' && (
                    <div className={styles.regularizationTab}>
                        <div className={styles.regularizationHeader}>
                            <h3>Regularization Requests</h3>
                            <button 
                                className={styles.newRegularizationButton}
                                onClick={() => setShowRegularizationModal(true)}
                            >
                                <FileText size={16} />
                                New Request
                            </button>
                        </div>
                        
                        <div className={styles.regularizationList}>
                            {attendanceData.regularizations.map((request, index) => (
                                <div key={index} className={styles.regularizationRequest}>
                                    <div className={styles.requestDate}>
                                        {new Date(request.date).toLocaleDateString('en-US', { 
                                            weekday: 'short', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                    
                                    <div className={styles.requestReason}>
                                        <p>{request.reason}</p>
                                        <span className={styles.requestType}>{request.type}</span>
                                    </div>
                                    
                                    <div className={`${styles.requestStatus} ${styles[request.status]}`}>
                                        {request.status === 'approved' && <CheckCircle size={16} />}
                                        {request.status === 'rejected' && <XCircle size={16} />}
                                        {request.status === 'pending' && <Clock size={16} />}
                                        <span>{request.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className={styles.reportsTab}>
                        <div className={styles.reportsGrid}>
                            <div className={styles.reportCard}>
                                <div className={styles.reportHeader}>
                                    <Award size={24} />
                                    <h3>Monthly Performance</h3>
                                </div>
                                <div className={styles.reportContent}>
                                    <div className={styles.performanceMetric}>
                                        <span>Attendance Rate</span>
                                        <span className={styles.metricValue}>91.7%</span>
                                    </div>
                                    <div className={styles.performanceMetric}>
                                        <span>Punctuality Score</span>
                                        <span className={styles.metricValue}>85.2%</span>
                                    </div>
                                    <div className={styles.performanceMetric}>
                                        <span>Average Hours/Day</span>
                                        <span className={styles.metricValue}>8.2h</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.reportCard}>
                                <div className={styles.reportHeader}>
                                    <Target size={24} />
                                    <h3>Goals & Targets</h3>
                                </div>
                                <div className={styles.reportContent}>
                                    <div className={styles.goalProgress}>
                                        <span>Monthly Target: 176h</span>
                                        <div className={styles.progressBar}>
                                            <div 
                                                className={styles.progressFill} 
                                                style={{ width: '92%' }}
                                            />
                                        </div>
                                        <span>162.5h completed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Regularization Modal */}
            {showRegularizationModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Request Regularization</h3>
                            <button 
                                className={styles.closeButton}
                                onClick={() => setShowRegularizationModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label>Date</label>
                                <input 
                                    type="date" 
                                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>Reason for Regularization</label>
                                <textarea 
                                    value={regularizationReason}
                                    onChange={(e) => setRegularizationReason(e.target.value)}
                                    placeholder="Please provide a detailed reason for your regularization request..."
                                    rows={4}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>Type</label>
                                <select>
                                    <option>Late In</option>
                                    <option>Early Out</option>
                                    <option>Missing Punch In</option>
                                    <option>Missing Punch Out</option>
                                    <option>Full Day</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.cancelButton}
                                onClick={() => setShowRegularizationModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.submitButton}
                                onClick={submitRegularization}
                            >
                                <Send size={16} />
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceProfile;
import AttendanceProfile from './AttendanceProfile';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
    return (
        <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
            <AttendanceProfile />
        </div>
    );
}
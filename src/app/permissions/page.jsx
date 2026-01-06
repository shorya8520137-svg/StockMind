import RealPermissionsManager from "./RealPermissionsManager.jsx";

export default function PermissionsPage() {
    return (
        <div style={{ 
            width: "100%", 
            height: "100vh", 
            padding: 0, 
            margin: 0, 
            overflow: "hidden" 
        }}>
            <RealPermissionsManager />
        </div>
    );
}
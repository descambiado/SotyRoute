import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import SotyDashboard from "./pages/SotyDashboard";
import Profiles from "./pages/Profiles";
import Evidence from "./pages/Evidence";
import Doctor from "./pages/Doctor";
import Settings from "./pages/Settings";
import { ActiveProfileProvider } from "./context/ActiveProfileContext";

export default function App() {
  return (
    <ActiveProfileProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/soty" element={<SotyDashboard />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/doctor" element={<Doctor />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </ActiveProfileProvider>
  );
}

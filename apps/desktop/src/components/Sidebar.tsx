import { NavLink } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/soty",      label: "SOTY Score" },
  { to: "/profiles",  label: "Profiles" },
  { to: "/evidence",  label: "Evidence" },
  { to: "/doctor",    label: "Doctor" },
  { to: "/settings",  label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">SotyRoute</span>
        <span className="brand-version">v0.1.0</span>
      </div>

      <nav>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        Windows-first preflight
        <br />
        @descambiado · SotyHUB
      </div>
    </aside>
  );
}

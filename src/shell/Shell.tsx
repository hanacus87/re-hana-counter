import { useState } from "react";
import { Route, Routes } from "react-router";
import { Balance } from "../balance/Balance";
import { Home } from "../counter/Home";
import { Drawer } from "./Drawer";
import { Header } from "./Header";
import { MenuIcon } from "./icons";
import { StatusScreen } from "./StatusScreen";

function NotFound() {
  return <StatusScreen code={404} />;
}

function LoginError() {
  return <StatusScreen code={403} />;
}

export function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <Header>
        <button
          type="button"
          className="menu-button"
          aria-label="メニュー"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon />
        </button>
      </Header>
      {menuOpen && <Drawer onClose={() => setMenuOpen(false)} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/login-error" element={<LoginError />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

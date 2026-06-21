import type { ReactNode } from "react";
import { Link } from "react-router";
import { Flower } from "./icons";

export function Header({
  reload = false,
  children,
}: {
  reload?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="header">
      {reload ? (
        <a href="/" className="home-link" aria-label="ホームへ">
          <Flower />
        </a>
      ) : (
        <Link to="/" className="home-link" aria-label="ホームへ">
          <Flower />
        </Link>
      )}
      {children}
    </header>
  );
}

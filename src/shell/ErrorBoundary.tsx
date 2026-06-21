import { Component, type ReactNode } from "react";
import { ApiError } from "../lib/api";
import { Header } from "./Header";
import { StatusScreen } from "./StatusScreen";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { code: number | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { code: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return { code: error instanceof ApiError ? error.status : 500 };
  }

  render() {
    if (this.state.code !== null) {
      return (
        <>
          <Header reload />
          <StatusScreen code={this.state.code} />
        </>
      );
    }
    return this.props.children;
  }
}

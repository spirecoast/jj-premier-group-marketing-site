"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/sentry/client";
import { cn } from "@/lib/utils";
import { ButtonLink, Button } from "./button";

/**
 * An error boundary around one interactive part of a page: the explorer,
 * the calendar, the planner, a questionnaire, a calculator. When that part
 * throws while rendering, only it is replaced; the heading, the list the
 * crawler reads, the lead form and the contact details stay. The fallback
 * keeps the part's footprint so the page doesn't jump, and offers to reload
 * the part (a fresh mount) and the way to call or text.
 *
 * The site-level error.tsx stays the net for everything outside an island.
 */
type Props = {
  /** What the part is called in the fallback: "the map", "the calendar". */
  name: string;
  /** Keeps the fallback the size of what it replaces. */
  minHeight?: string;
  className?: string;
  children: ReactNode;
};

type State = { error: Error | null; attempt: number };

export class IslandBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[site] ${this.props.name} failed to render`, error, info.componentStack);
    reportClientError(error);
  }

  reset = () => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));

  render() {
    const { name, minHeight, className, children } = this.props;
    if (!this.state.error) {
      return (
        <div key={this.state.attempt} className="contents">
          {children}
        </div>
      );
    }
    return (
      <div role="alert" className={cn("container-site flex items-center py-section", className)} style={minHeight ? { minHeight } : undefined}>
        <div className="flex max-w-[640px] flex-col gap-5 border border-hairline bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="t-h3 text-navy">This part of the page didn’t load.</p>
            <p className="t-body text-body">
              Something went wrong drawing {name}. The rest of the page is here. Reload the part, or call or text us and we’ll pick it up from there.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button dash onClick={this.reset}>
              Reload this part
            </Button>
            <ButtonLink href="/contact" variant="outline">
              Call or text us
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }
}

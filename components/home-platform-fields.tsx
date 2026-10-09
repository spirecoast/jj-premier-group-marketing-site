"use client";

import { type InputHTMLAttributes, useEffect, useRef, useState } from "react";
import { pixelCapturingHere } from "@/lib/home-platform";

/**
 * A tick box whose state reaches our server through a hidden input. Home
 * Platform's pixel (lib/home-platform.ts) sends every named field's value to
 * the CRM, and a checkbox's value is "on" whether or not it is ticked, so an
 * unticked consent box would read as consent there. Once the page is
 * interactive (which the pixel needs too) the box loses its name and a hidden
 * input, which the pixel skips, carries "on" or "". Without JavaScript the
 * box keeps its name and posts as it always did.
 */
export function ConsentBox({ name, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "onChange"> & { name: string }) {
  const [live, setLive] = useState(false);
  const box = useRef<HTMLInputElement>(null);
  const mirror = useRef<HTMLInputElement>(null);
  useEffect(() => setLive(true), []);
  useEffect(() => {
    if (!live) return;
    const sync = () => {
      if (box.current && mirror.current) mirror.current.value = box.current.checked ? "on" : "";
    };
    sync();
    // React resets uncontrolled fields after a form action; read the box again once the reset has run.
    const form = box.current?.form;
    const onReset = () => window.setTimeout(sync, 0);
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [live]);
  return (
    <>
      <input
        ref={box}
        type="checkbox"
        name={live ? undefined : name}
        onChange={(e) => {
          if (mirror.current) mirror.current.value = e.target.checked ? "on" : "";
        }}
        {...props}
      />
      {live ? <input ref={mirror} type="hidden" name={name} defaultValue="" /> : null}
    </>
  );
}

/**
 * Records with the lead whether Home Platform's pixel will have sent this form
 * to the CRM itself (`source.homePlatformPixel`), so a server-side path into
 * the CRM can skip those and avoid a duplicate. Set when the page loads, when
 * the visitor starts on the form and as it is sent.
 */
export function HomePlatformPixelFlag() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = ref.current;
    const form = input?.form;
    if (!input || !form) return;
    const set = () => {
      input.value = pixelCapturingHere() ? "true" : "";
    };
    set();
    window.addEventListener("load", set);
    form.addEventListener("focusin", set, true);
    form.addEventListener("submit", set, true);
    return () => {
      window.removeEventListener("load", set);
      form.removeEventListener("focusin", set, true);
      form.removeEventListener("submit", set, true);
    };
  }, []);
  return <input ref={ref} type="hidden" name="homePlatformPixel" defaultValue="" />;
}

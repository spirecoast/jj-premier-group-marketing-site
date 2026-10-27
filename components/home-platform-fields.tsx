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
export function ConsentBox({ name, defaultChecked, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "onChange"> & { name: string }) {
  const [live, setLive] = useState(false);
  // The mirror's value is React state, not a value written into the DOM: a
  // hidden input's value is its attribute, which React rewrites from its props
  // on every render, so a written-in "on" would be lost the next time the
  // form re-renders (a field's error appearing, say).
  const [checked, setChecked] = useState(Boolean(defaultChecked));
  const box = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setLive(true);
    // The browser may have restored the box (back/forward cache, autofill) before React ran.
    if (box.current) setChecked(box.current.checked);
    // React resets uncontrolled fields after a form action; read the box again once the reset has run.
    const form = box.current?.form;
    const onReset = () => window.setTimeout(() => box.current && setChecked(box.current.checked), 0);
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, []);
  return (
    <>
      <input ref={box} type="checkbox" name={live ? undefined : name} defaultChecked={defaultChecked} onChange={(e) => setChecked(e.target.checked)} {...props} />
      {live ? <input type="hidden" name={name} value={checked ? "on" : ""} /> : null}
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

import { useEffect, useState } from "react";

export function useIsSm() {
  const [isSm, setIsSm] = useState(false);
  useEffect(() => {
    const check = () => setIsSm(window.innerWidth >= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isSm;
}

export function useIsMd() {
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const check = () => setIsMd(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMd;
}

export function useIsLg() {
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const check = () => setIsLg(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isLg;
}

export function useIsXl() {
  const [isXl, setIsXl] = useState(false);
  useEffect(() => {
    const check = () => setIsXl(window.innerWidth >= 1280);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isXl;
}

export function useIs2Xl() {
  const [is2Xl, setIs2Xl] = useState(false);
  useEffect(() => {
    const check = () => setIs2Xl(window.innerWidth >= 1536);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return is2Xl;
}

export function useBreakpoints() {
  const [breakpoints, setBreakpoints] = useState({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    "2xl": false,
  });

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      setBreakpoints({
        sm: width >= 640,
        md: width >= 768,
        lg: width >= 1024,
        xl: width >= 1280,
        "2xl": width >= 1536,
      });
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return {
    smallerThan: {
      sm: !breakpoints.sm,
      md: !breakpoints.md,
      lg: !breakpoints.lg,
      xl: !breakpoints.xl,
      "2xl": !breakpoints["2xl"],
    },
    largerThan: {
      sm: breakpoints.sm,
      md: breakpoints.md,
      lg: breakpoints.lg,
      xl: breakpoints.xl,
      "2xl": breakpoints["2xl"],
    },
  };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

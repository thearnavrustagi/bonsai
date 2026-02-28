"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Wrench, Briefcase } from "lucide-react";

export type Tab = "research" | "engineering" | "business";

interface FloatingNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof FlaskConical }[] = [
  { id: "research", label: "Research", icon: FlaskConical },
  { id: "engineering", label: "Engineering", icon: Wrench },
  { id: "business", label: "Business", icon: Briefcase },
];

const tabColors: Record<Tab, { bg: string; border: string }> = {
  research: {
    bg: "rgb(58, 46, 20)",
    border: "rgb(90, 72, 30)",
  },
  engineering: {
    bg: "rgb(36, 20, 72)",
    border: "rgb(56, 30, 110)",
  },
  business: {
    bg: "rgb(16, 52, 40)",
    border: "rgb(24, 78, 60)",
  },
};

export function FloatingNav({ activeTab, onTabChange }: FloatingNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<Tab, HTMLButtonElement>>(new Map());
  const [pill, setPill] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    const container = containerRef.current;
    const btn = buttonRefs.current.get(activeTab);
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setPill({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [activeTab]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const colors = tabColors[activeTab];

  return (
    <motion.nav
      className="fixed bottom-6 left-1/2 z-50 rounded-full border"
      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 2px 12px rgba(0,0,0,0.3)" }}
      initial={{ y: 80, x: "-50%", opacity: 0 }}
      animate={{
        y: 0,
        x: "-50%",
        opacity: 1,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
        delay: 0.3,
        backgroundColor: { type: "tween", duration: 0.4, ease: "easeInOut" },
        borderColor: { type: "tween", duration: 0.4, ease: "easeInOut" },
      }}
    >
      <div
        ref={containerRef}
        className="relative flex items-center gap-0.5 px-1.5 py-1.5"
      >
        {/* Sliding pill */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 rounded-full"
          animate={{
            left: pill.left,
            width: pill.width,
          }}
          style={{
            backgroundColor: "#FFFDF8",
            boxShadow: "0 1px 10px rgba(255,253,248,0.25), 0 0 24px rgba(255,253,248,0.06)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(tab.id, el);
              }}
              onClick={() => onTabChange(tab.id)}
              className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer"
            >
              <motion.span
                className="relative flex items-center gap-2 font-[family-name:var(--font-dm-sans)] text-xs font-semibold tracking-wide"
                animate={{
                  color: isActive
                    ? "#0C0C0C"
                    : "rgba(154, 144, 128, 0.6)",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}

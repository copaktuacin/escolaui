import { Button } from "@/components/ui/button";
import {
  Calendar,
  ClipboardList,
  CreditCard,
  Home,
  LayoutGrid,
  School,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { OnboardingStep } from "../lib/onboarding";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  School,
  Users,
  Calendar,
  LayoutGrid,
  UserCheck,
  Video,
  ClipboardList,
  CreditCard,
  Home,
};

type Props = {
  steps: OnboardingStep[];
  role: string;
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
};

export default function OnboardingWizard({
  steps,
  userName,
  onComplete,
  onSkip,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const step = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const IconComponent = ICONS[step.icon] ?? Home;

  function handleAction() {
    if (step.navigateTo) {
      onComplete();
      window.location.href = step.navigateTo;
    } else if (!isLast) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete();
    }
  }

  function handleNext() {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onSkip();
  }

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center p-4 m-0 max-w-none w-full h-full border-0 bg-transparent"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
      aria-label="Onboarding wizard"
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md relative"
        style={{
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "transform 0.3s ease, opacity 0.3s ease",
          opacity: visible ? 1 : 0,
        }}
        data-ocid="onboarding.dialog"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Skip onboarding"
          data-ocid="onboarding.close_button"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Header — only on first step */}
        {isFirst && (
          <div className="px-6 pt-6 pb-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              Welcome to EscolaUI
            </p>
            <h2 className="text-xl font-bold text-foreground leading-snug">
              Welcome, {userName}! 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Let&apos;s get you set up in a few quick steps.
            </p>
          </div>
        )}

        {/* Step content with fade transition */}
        <div
          className="px-6 pt-6 pb-2"
          key={step.id}
          style={{
            animation: "onboarding-fade-in 0.2s ease forwards",
          }}
        >
          {/* Step icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <IconComponent className="w-7 h-7 text-primary" />
          </div>

          {/* Step counter */}
          <p className="text-xs text-muted-foreground font-medium mb-1">
            Step {currentIndex + 1} of {steps.length}
          </p>

          <h3 className="text-lg font-bold text-foreground mb-1.5">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mt-5">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? "20px" : "8px",
                  height: "8px",
                  backgroundColor:
                    i === currentIndex
                      ? "var(--color-primary)"
                      : i < currentIndex
                        ? "var(--color-primary)"
                        : "var(--color-muted-foreground)",
                  opacity:
                    i === currentIndex ? 1 : i < currentIndex ? 0.4 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            data-ocid="onboarding.cancel_button"
          >
            Skip for now
          </button>

          <div className="flex gap-2">
            {step.navigateTo && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAction}
                data-ocid="onboarding.secondary_button"
              >
                {step.actionLabel}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              data-ocid="onboarding.primary_button"
            >
              {isLast ? "Get Started" : "Next →"}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes onboarding-fade-in {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </dialog>
  );
}

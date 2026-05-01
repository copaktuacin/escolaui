import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Home,
  LayoutGrid,
  PartyPopper,
  School,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
  const [direction, setDirection] = useState<1 | -1>(1);
  const [visible, setVisible] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const step = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const IconComponent = ICONS[step.icon] ?? Home;

  function handleAction() {
    if (step.navigateTo) {
      onComplete();
      window.location.href = step.navigateTo;
    } else if (!isLast) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    } else {
      handleFinish();
    }
  }

  function handleNext() {
    if (isLast) {
      handleFinish();
    } else {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (!isFirst) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleFinish() {
    setCompleted(true);
    setTimeout(() => onComplete(), 1800);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onSkip();
    if (e.key === "ArrowRight" && !isLast) handleNext();
    if (e.key === "ArrowLeft" && !isFirst) handleBack();
  }

  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 32 : -32,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -32 : 32,
      opacity: 0,
    }),
  };

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center p-4 m-0 max-w-none w-full h-full border-0 bg-transparent"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
      aria-label="Onboarding wizard"
      onKeyDown={handleKeyDown}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-md relative"
        data-ocid="onboarding.dialog"
      >
        {/* Completion overlay */}
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-10 bg-card rounded-2xl flex flex-col items-center justify-center p-8 shadow-modal"
              style={{ border: "1px solid oklch(var(--border))" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 400,
                  damping: 12,
                }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "oklch(0.72 0.19 145 / 0.15)",
                  border: "2px solid oklch(0.72 0.19 145 / 0.4)",
                }}
              >
                <CheckCircle2
                  className="w-8 h-8"
                  style={{ color: "oklch(0.72 0.19 145)" }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PartyPopper className="w-5 h-5 text-warning" />
                  <h3 className="text-xl font-bold text-foreground font-display">
                    You&apos;re all set!
                  </h3>
                  <PartyPopper className="w-5 h-5 text-warning scale-x-[-1]" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Welcome to EscolaUI, {userName}.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main card */}
        <div
          className="bg-card rounded-2xl shadow-modal relative overflow-hidden"
          style={{ border: "1px solid oklch(var(--border))" }}
        >
          {/* Decorative top gradient strip */}
          <div
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, var(--color-primary), oklch(0.6 0.2 265), oklch(0.72 0.19 145))",
            }}
          />

          {/* Close / Skip button */}
          <button
            type="button"
            onClick={onSkip}
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center hover:bg-accent transition-colors z-10"
            aria-label="Skip onboarding"
            data-ocid="onboarding.close_button"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Progress bar */}
          <div className="px-6 pt-5 pb-0">
            <div className="flex items-center justify-between mb-1.5">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: "var(--color-primary)" }}
              >
                EscolaUI Setup
              </p>
              <span className="text-[10px] font-medium text-muted-foreground">
                {currentIndex + 1} / {steps.length}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--color-primary)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>

          {/* Step content with slide animation */}
          <div className="overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step.id}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="px-6 pt-5 pb-2"
              >
                {/* Step icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.2 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-card"
                  style={{
                    background: "var(--color-primary-light)",
                    border: "1px solid oklch(var(--primary) / 0.2)",
                  }}
                >
                  <IconComponent className="w-6 h-6 text-primary" />
                </motion.div>

                {/* Welcome heading — first step only */}
                {isFirst && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="mb-3"
                  >
                    <h2 className="text-xl font-bold text-foreground font-display leading-snug">
                      Welcome, {userName}! 👋
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Let&apos;s get you set up in a few quick steps.
                    </p>
                  </motion.div>
                )}

                <h3 className="text-base font-bold text-foreground font-display mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mt-5">
                  {steps.map((s, i) => (
                    <motion.button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setDirection(i > currentIndex ? 1 : -1);
                        setCurrentIndex(i);
                      }}
                      className="rounded-full transition-all duration-300 focus-ring"
                      aria-label={`Go to step ${i + 1}`}
                      animate={{
                        width: i === currentIndex ? "20px" : "8px",
                        height: "8px",
                      }}
                      style={{
                        background:
                          i === currentIndex
                            ? "var(--color-primary)"
                            : i < currentIndex
                              ? "var(--color-primary)"
                              : "oklch(var(--muted-foreground) / 0.3)",
                        opacity: i < currentIndex ? 0.45 : 1,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 flex items-center justify-between gap-3 border-t border-border/60">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="onboarding.cancel_button"
            >
              Skip for now
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 px-3 text-sm"
                  data-ocid="onboarding.back_button"
                >
                  ← Back
                </Button>
              )}

              {step.navigateTo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                  className="h-8 px-3 text-sm"
                  data-ocid="onboarding.secondary_button"
                >
                  {step.actionLabel}
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleNext}
                className="h-8 px-4 text-sm font-semibold shadow-card hover:shadow-elevated transition-all btn-press"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                }}
                data-ocid="onboarding.primary_button"
              >
                {isLast ? (
                  <span className="flex items-center gap-1.5">
                    Get Started
                    <PartyPopper className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  "Next →"
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </dialog>
  );
}

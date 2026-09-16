// src/components/wizard/WizardProgressBar.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useSetupWizardStore } from "@/store/useSetupWizardStore";

export interface WizardStepInfo {
  step: number;
  title: string;
  subtitle: string;
}

export const WIZARD_STEPS: WizardStepInfo[] = [
  { step: 1, title: "Company Info", subtitle: "Organization & Admin" },
  { step: 2, title: "Company Settings", subtitle: "Working hours & branding" },
  { step: 3, title: "Holiday Calendar", subtitle: "National & regional leaves" },
  { step: 4, title: "Departments", subtitle: "Structure & units" },
  { step: 5, title: "Roles & Titles", subtitle: "Job designations" },
  { step: 6, title: "Salary Structure", subtitle: "Payroll components" },
  { step: 7, title: "Leave Policies", subtitle: "Time-off rules" },
  { step: 8, title: "Shift Types", subtitle: "Working shift timings" },
  { step: 9, title: "Branches", subtitle: "Offices & locations" },
  { step: 10, title: "Invite Team", subtitle: "Onboard employees" },
];

export default function WizardProgressBar() {
  const { currentStep, setStep } = useSetupWizardStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll boundary to toggle scroll arrow indicators
  const checkScrollBoundaries = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  };

  // Scroll to active step smoothly when step changes
  useEffect(() => {
    const activeElement = stepRefs.current[currentStep - 1];
    if (activeElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementLeft = activeElement.offsetLeft;
      const elementWidth = activeElement.offsetWidth;
      const containerWidth = container.clientWidth;

      // Center the active step within the scrollable viewport
      const targetScrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }
    // Update scroll arrows after smooth scroll finishes
    const timer = setTimeout(checkScrollBoundaries, 350);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleScroll = () => {
    checkScrollBoundaries();
  };

  const scrollByAmount = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.6;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full relative group mb-8">
      {/* Container with modern rounded card look */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 px-3 py-6 sm:px-6 sm:py-7 relative overflow-hidden">
        
        {/* Left Scroll Button Indicator */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            aria-label="Scroll left"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 dark:hover:text-emerald-400 transition-all opacity-80 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Scroll Button Indicator */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            aria-label="Scroll right"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 dark:hover:text-emerald-400 transition-all opacity-80 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container (Shows 5 steps on desktop, scrollable for all 10, hidden scrollbar) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex items-start overflow-x-auto scroll-smooth select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 sm:px-2"
        >
          {WIZARD_STEPS.map((stepItem, index) => {
            const isCompleted = stepItem.step < currentStep;
            const isCurrent = stepItem.step === currentStep;
            const isPending = stepItem.step > currentStep;
            const isClickable = stepItem.step <= currentStep;

            return (
              <div
                key={stepItem.step}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                onClick={() => {
                  if (isClickable) {
                    setStep(stepItem.step);
                  }
                }}
                className={`flex-shrink-0 flex flex-col items-center relative transition-all duration-200 ${
                  // Responsive width: 5 items visible on screen (20% each) for medium+ screens, ~170px for smaller screens
                  "w-[170px] sm:w-[190px] md:w-[20%] min-w-[155px] md:min-w-[20%] max-w-[20%]"
                } ${isClickable ? "cursor-pointer group/item" : "cursor-default opacity-85"}`}
              >
                {/* Connecting Track Lines */}
                <div className="w-full flex items-center absolute top-5 sm:top-5.5 left-0 right-0 -z-0">
                  {/* Left Connector Line */}
                  <div
                    className={`h-[2.5px] w-1/2 transition-colors duration-300 ${
                      index === 0
                        ? "invisible"
                        : isCompleted || isCurrent
                        ? "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                  {/* Right Connector Line */}
                  <div
                    className={`h-[2.5px] w-1/2 transition-colors duration-300 ${
                      index === WIZARD_STEPS.length - 1
                        ? "invisible"
                        : isCompleted
                        ? "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                </div>

                {/* Step Node Icon */}
                <div className="relative z-10 flex items-center justify-center mb-3">
                  {isCompleted ? (
                    // Completed Step: Teal/Emerald rounded squircle with white checkmark
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover/item:scale-105 group-hover/item:bg-emerald-600 transition-all duration-200">
                      <Check className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[3]" />
                    </div>
                  ) : isCurrent ? (
                    // Active / Current Step: Teal/Emerald rounded squircle with white inner squircle dot & focus ring
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center ring-4 ring-emerald-100 dark:ring-emerald-950/70 shadow-lg shadow-emerald-500/30 group-hover/item:scale-105 transition-all duration-200 animate-in fade-in zoom-in-95">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-[4px] shadow-sm" />
                    </div>
                  ) : (
                    // Upcoming / Pending Step: Light gray rounded squircle with subtle inner gray dot
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 transition-all duration-200">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-slate-300 dark:bg-slate-600 rounded-[3px]" />
                    </div>
                  )}
                </div>

                {/* Step Text Info */}
                <div className="text-center px-1 max-w-full">
                  <p
                    className={`text-xs sm:text-sm font-bold tracking-tight leading-tight ${
                      isCurrent
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isCompleted
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    Step {stepItem.step}
                  </p>
                  <p
                    title={stepItem.title}
                    className={`text-xs truncate max-w-[135px] sm:max-w-[150px] font-medium mt-0.5 ${
                      isCurrent
                        ? "text-slate-900 dark:text-slate-100 font-semibold"
                        : isCompleted
                        ? "text-slate-600 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {stepItem.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

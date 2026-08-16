interface RegistrationProgressProps {
  currentStep: number;
  stepLabels: string[];
}

export function RegistrationProgress({ currentStep, stepLabels }: RegistrationProgressProps) {
  const totalSteps = stepLabels.length;

  return (
    <div className="mb-8 sm:mb-10">
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10 ${
                    isCompleted
                      ? "bg-accent text-white"
                      : isActive
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary/40"
                  }`}
                >
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`mt-2 hidden text-center text-xs font-medium sm:block ${
                    isActive ? "text-primary" : isCompleted ? "text-accent" : "text-muted/50"
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < stepLabels.length - 1 && (
                <div className="mx-1 flex-1 sm:mx-2">
                  <div
                    className={`h-0.5 w-full ${
                      isCompleted ? "bg-accent" : "bg-primary/10"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center text-xs text-muted sm:hidden">
        Langkah {currentStep} dari {totalSteps}: {stepLabels[currentStep - 1]}
      </div>
    </div>
  );
}

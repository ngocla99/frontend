import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

export const ProgressIndicator = ({
  steps,
  currentStep,
  completedSteps,
  className,
  variant = 'horizontal',
  showLabels = true
}: ProgressIndicatorProps) => {
  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);
  const isStepCurrent = (stepId: string) => stepId === currentStep;

  if (variant === 'vertical') {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isStepCompleted(step.id) 
                  ? "bg-primary text-primary-foreground"
                  : isStepCurrent(step.id)
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {isStepCompleted(step.id) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isStepCurrent(step.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-0.5 h-8 mt-2",
                  isStepCompleted(step.id) ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
            {showLabels && (
              <div className="flex-1 pt-1">
                <p className={cn(
                  "font-medium text-sm",
                  isStepCurrent(step.id) ? "text-primary" : "text-foreground"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isStepCompleted(step.id) 
                ? "bg-primary text-primary-foreground"
                : isStepCurrent(step.id)
                ? "bg-primary/20 text-primary border-2 border-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {isStepCompleted(step.id) ? (
                <CheckCircle className="w-4 h-4" />
              ) : isStepCurrent(step.id) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            {showLabels && (
              <p className={cn(
                "text-xs mt-2 text-center max-w-16",
                isStepCurrent(step.id) ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {step.label}
              </p>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "h-0.5 w-12 mx-2",
              isStepCompleted(step.id) ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );
};

export const SimpleProgressBar = ({ 
  progress, 
  className,
  showPercentage = true
}: { 
  progress: number; 
  className?: string;
  showPercentage?: boolean;
}) => (
  <div className={cn("space-y-2", className)}>
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">Processing...</span>
      {showPercentage && (
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      )}
    </div>
    <div className="w-full bg-muted rounded-full h-2">
      <div 
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  </div>
);
"use client";

import { getTaskHistory } from "@/lib/db";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, HomeIcon as House } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import {
  saveWalkthroughState,
  loadWalkthroughState,
  WalkthroughState,
} from "@/lib/indexedDB";

export function Walkthrough({ taskId }: { taskId: number }) {
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [parsedDays, setParsedDays] = useState<string[][]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [finishedDays, setFinishedDays] = useState<boolean[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [completionStats, setCompletionStats] = useState({
    completed: 0,
    total: 0,
  });
  const [purpleCount, setPurpleCount] = useState<number>(0);
  const [clearedTaskSchedule, setClearedTaskSchedule] = useState(false);
  const [stateInitialized, setStateInitialized] = useState(false);

  const router = useRouter();

  const navigateHome = () => {
    router.push("/");
  };

  const incrementPurpleCount = () => {
    setPurpleCount((prev) => prev + 1);
  };

  // Save state to IndexedDB whenever relevant state changes
  useEffect(() => {
    if (!stateInitialized || !taskId) return;

    const saveState = async () => {
      try {
        const state: WalkthroughState = {
          taskId,
          currentDayIndex,
          parsedDays,
          checkedItems,
          finishedDays,
          completionStats,
          purpleCount,
          clearedTaskSchedule,
        };

        await saveWalkthroughState(state);
      } catch (error) {
        console.error("Error saving state to IndexedDB:", error);
      }
    };

    saveState();
  }, [
    stateInitialized,
    taskId,
    currentDayIndex,
    parsedDays,
    checkedItems,
    finishedDays,
    completionStats,
    purpleCount,
    clearedTaskSchedule,
  ]);

  useEffect(() => {
    const fetchHistoryAndInitState = async () => {
      try {
        // First, try to load state from IndexedDB
        const savedState = await loadWalkthroughState(taskId);

        if (savedState) {
          // Restore all state from IndexedDB
          setCurrentDayIndex(savedState.currentDayIndex);
          setParsedDays(savedState.parsedDays);
          setCheckedItems(savedState.checkedItems);
          setFinishedDays(savedState.finishedDays);
          setCompletionStats(savedState.completionStats);
          setPurpleCount(savedState.purpleCount);
          setClearedTaskSchedule(savedState.clearedTaskSchedule);
          setStateInitialized(true);
          setLoading(false);
        } else {
          // No saved state, initialize from API
          const historyData = await getTaskHistory();

          // Find the task with matching ID
          const task = historyData.find((item) => item.id === taskId);

          if (task && task.apiOutput) {
            // Parse the API output to separate days
            const days = task.apiOutput
              .split("\n\n")
              .filter((day) => day.trim().startsWith("Day"));

            // Parse each day's content into an array of lines
            const parsedContent = days.map((day) => day.split("\n"));
            setParsedDays(parsedContent);

            // Initialize checked state for all items
            const initialCheckedState: Record<string, boolean> = {};
            parsedContent.forEach((day, dayIndex) => {
              day.forEach((line, lineIndex) => {
                if (lineIndex > 0) {
                  // Skip the day title
                  initialCheckedState[`${dayIndex}-${lineIndex}`] = false;
                }
              });
            });
            setCheckedItems(initialCheckedState);

            // Initialize all days as unfinished
            setFinishedDays(new Array(parsedContent.length).fill(false));
            setStateInitialized(true);
          }

          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing task:", error);
        setLoading(false);
      }
    };

    fetchHistoryAndInitState();
  }, [taskId]);

  const goToNextDay = () => {
    if (currentDayIndex < parsedDays.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    } else {
      checkFinishedTaskSchedule();
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const toggleChecked = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFinishDayClick = () => {
    setShowConfirmDialog(true);
  };

  const calculateCompletionStats = () => {
    let completed = 0;
    let total = 0;

    parsedDays[currentDayIndex].forEach((line, index) => {
      if (index > 0) {
        // Skip the day title
        total++;
        const itemKey = `${currentDayIndex}-${index}`;
        if (checkedItems[itemKey]) {
          completed++;
        }
      }
    });

    return { completed, total };
  };

  const fullyCompleted = () => {
    const { completed, total } = calculateCompletionStats();
    const perfect = completed === total;
    return perfect;
  };

  const finishDay = () => {
    // Close the confirmation dialog
    setShowConfirmDialog(false);

    // Calculate completion stats
    const stats = calculateCompletionStats();
    setCompletionStats(stats);

    const perfection = fullyCompleted();
    if (perfection) {
      incrementPurpleCount();
    }

    // Show completion screen
    setShowCompletionScreen(true);
  };

  const continueToNextDay = () => {
    // Hide completion screen
    setShowCompletionScreen(false);

    if (currentDayIndex >= parsedDays.length - 1) {
      // If it's the last day, just mark it as finished
      const updatedFinishedDays = [...finishedDays];
      updatedFinishedDays[currentDayIndex] = true;
      setFinishedDays(updatedFinishedDays);
      checkFinishedTaskSchedule();
      return;
    }

    // Find unchecked items for the current day
    const uncheckedItems: string[] = [];
    parsedDays[currentDayIndex].forEach((line, index) => {
      if (index > 0) {
        // Skip the day title
        const itemKey = `${currentDayIndex}-${index}`;
        if (!checkedItems[itemKey]) {
          uncheckedItems.push(line);
        }
      }
    });

    // Mark current day as finished
    const updatedFinishedDays = [...finishedDays];
    updatedFinishedDays[currentDayIndex] = true;
    setFinishedDays(updatedFinishedDays);

    // If there are unchecked items, add them to the next day
    if (uncheckedItems.length > 0 && currentDayIndex < parsedDays.length - 1) {
      const updatedParsedDays = [...parsedDays];
      // Add unchecked items to the beginning of the next day (after the title)
      updatedParsedDays[currentDayIndex + 1] = [
        updatedParsedDays[currentDayIndex + 1][0],
        ...uncheckedItems,
        ...updatedParsedDays[currentDayIndex + 1].slice(1),
      ];
      setParsedDays(updatedParsedDays);

      // Update checked items state for the new items in the next day
      const updatedCheckedItems = { ...checkedItems };
      uncheckedItems.forEach((_, index) => {
        updatedCheckedItems[`${currentDayIndex + 1}-${index + 1}`] = false;
      });
      setCheckedItems(updatedCheckedItems);
    }

    // Move to the next day
    setCurrentDayIndex(currentDayIndex + 1);
  };

  const checkFinishedTaskSchedule = () => {
    // Check if all days are finished
    const allDaysFinished =
      finishedDays.every((day) => day === true) ||
      (currentDayIndex === parsedDays.length - 1 &&
        finishedDays.slice(0, -1).every((day) => day === true));

    if (allDaysFinished) {
      setClearedTaskSchedule(true);
      // Calculate overall completion stats
      let totalCompleted = 0;
      let totalTasks = 0;

      parsedDays.forEach((day, dayIndex) => {
        day.forEach((_, lineIndex) => {
          if (lineIndex > 0) {
            // Skip the day title
            totalTasks++;
            const itemKey = `${dayIndex}-${lineIndex}`;
            if (checkedItems[itemKey]) {
              totalCompleted++;
            }
          }
        });
      });

      setCompletionStats({
        completed: totalCompleted,
        total: totalTasks,
      });

      // Show completion screen
      setShowCompletionScreen(false);

      const starDurationPercent = purpleCount / parsedDays.length;
      const starDuration = Math.round(starDurationPercent * 3);

      // Trigger confetti celebration
      if (starDuration <= 0) {
        // If starDuration is 0 or less, trigger 3 fireworks with the color palette
        confettiFireworks(true, 3);
      } else {
        // Trigger fireworks based on starDuration, but no more than 3
        const fireworksToTrigger = Math.min(starDuration, 3);
        confettiFireworks(true, fireworksToTrigger, [
          "9C27B0",
          "7B1FA2",
          "BA68C8",
          "6A1B9A",
          "D1C4E9",
        ]);

        // Calculate how many more fireworks are needed to reach 3
        const remainingFireworks = 3 - fireworksToTrigger;
        if (remainingFireworks > 0) {
          if (remainingFireworks == 1) {
            setTimeout(() => {
              confettiFireworks(true, remainingFireworks); // Use a function reference here
            }, 1800);
          }
          if (remainingFireworks == 2) {
            setTimeout(() => {
              confettiFireworks(true, remainingFireworks); // Use a function reference here
            }, 900);
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">Loading task history...</div>
    );
  }

  if (parsedDays.length === 0) {
    return (
      <div className="flex justify-center p-8">
        No task history found for this ID.
      </div>
    );
  }

  const confettiFireworks = (
    gold = false,
    dur = 3,
    colors = ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
  ) => {
    const duration = dur * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 20 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      if (gold) {
        const stars = {
          spread: 360,
          ticks: 50,
          gravity: 2,
          decay: 0.94,
          startVelocity: 30,
          colors,
        };

        function shoot() {
          confetti({
            ...stars,
            particleCount: 40,
            scalar: 1.2,
            origin: {
              x: randomInRange(0.1, 0.9),
              y: randomInRange(0.1, 0.9),
            }, // Normalize coordinates
            shapes: ["star"],
          });

          confetti({
            ...stars,
            particleCount: 10,
            scalar: 0.75,
            origin: {
              x: randomInRange(0.1, 0.9),
              y: randomInRange(0.1, 0.9),
            }, // Normalize coordinates
            shapes: ["circle"],
          });
        }
        shoot();
        setTimeout(shoot, 100);
      } else {
        // Regular confetti fireworks effect
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }
    }, 250);
  };

  const confettiStars = ({
    xCoord,
    yCoord,
    color,
  }: {
    xCoord: number;
    yCoord: number;
    color: string[];
  }) => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 5,
      colors: color,
      zIndex: 20,
      origin: { x: xCoord / window.innerWidth, y: yCoord / window.innerHeight }, // Normalize coordinates
    };

    function shoot() {
      confetti({
        ...defaults,
        particleCount: 20,
        scalar: 1.2 / 1.5,
        shapes: ["star"],
      });

      confetti({
        ...defaults,
        particleCount: 5,
        scalar: 0.75 / 1.5,
        shapes: ["circle"],
      });
    }

    setTimeout(shoot, 0);
  };

  const isPastDay = (dayIndex: number) => finishedDays[dayIndex];
  const isFutureDay = (dayIndex: number) => dayIndex > currentDayIndex;
  const isCurrentDayAccessible =
    currentDayIndex === 0 || finishedDays[currentDayIndex - 1];

  return (
    <div>
      <div className="flex justify-center">
        {clearedTaskSchedule && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <Card className="border-2 border-primary shadow-lg mt-6 max-w-4xl">
              <CardHeader className="bg-primary/10">
                <CardTitle className="text-center text-primary flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-6 w-6" />
                  Congratulations!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">
                  You&apos;ve Completed the Entire Task Schedule!
                </h2>
                <p className="text-lg mb-6">
                  {completionStats.completed}/{completionStats.total} tasks
                  completed across all days
                </p>
                <Button
                  onClick={navigateHome}
                  size="lg"
                  className="px-8 py-6 text-lg"
                >
                  <House className="mr-2 h-5 w-5" />
                  Return Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {showCompletionScreen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 grid place-items-center"
          style={{
            opacity: showCompletionScreen ? 1 : 0,
            transition: "opacity 150ms ease-in-out",
          }}
        >
          <div className="text-center p-6 max-w-md animate-in fade-in duration-300">
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Day Completed!</h2>
            <p className="text-lg mb-4">
              {completionStats.completed}/{completionStats.total} tasks
              completed
            </p>
            <Button onClick={continueToNextDay} size="lg">
              Continue to Next Day
            </Button>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <Button
            onClick={goToPreviousDay}
            disabled={currentDayIndex === 0}
            variant="outline"
            size="sm"
            className="py-5"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Prev Day
          </Button>

          <Button size="icon" variant="outline" onClick={navigateHome}>
            <House />
          </Button>

          <Button
            onClick={goToNextDay}
            disabled={currentDayIndex === parsedDays.length - 1}
            variant="outline"
            size="sm"
            className="py-5"
          >
            Next Day
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <Card className="relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {parsedDays[currentDayIndex] && parsedDays[currentDayIndex][0]} /{" "}
              {parsedDays.length}
            </CardTitle>
          </CardHeader>
          {finishedDays[currentDayIndex] && (
            <div
              className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium hover:scale-95 cursor-pointer duration-300 ease-in-out"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                confettiStars({
                  xCoord: rect.left + rect.width / 2,
                  yCoord: rect.top + rect.height / 2,
                  color: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
                });
              }}
            >
              Completed
            </div>
          )}
          {finishedDays[currentDayIndex] && fullyCompleted() && (
            <div
              className="absolute top-4 right-32 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium hover:scale-95 cursor-pointer duration-300 ease-in-out"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                confettiStars({
                  xCoord: rect.left + rect.width / 2,
                  yCoord: rect.top + rect.height / 2,
                  color: ["9C27B0", "7B1FA2", "BA68C8", "6A1B9A", "D1C4E9"],
                });
              }}
            >
              Perfect
            </div>
          )}
          <CardContent>
            {parsedDays[currentDayIndex] &&
              parsedDays[currentDayIndex].map((line, index) => {
                // Skip the day title (index 0)
                if (index === 0) return null;

                const itemKey = `${currentDayIndex}-${index}`;
                const isDisabled =
                  isFutureDay(currentDayIndex) ||
                  isPastDay(currentDayIndex) ||
                  !isCurrentDayAccessible;

                return (
                  <div
                    key={index}
                    className="flex items-start space-x-2 py-2 border-b border-border last:border-0"
                  >
                    <Checkbox
                      id={itemKey}
                      checked={checkedItems[itemKey] || false}
                      onCheckedChange={() => toggleChecked(itemKey)}
                      disabled={isDisabled}
                    />
                    <label
                      htmlFor={itemKey}
                      className={`flex-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"} ${
                        checkedItems[itemKey]
                          ? "line-through text-muted-foreground"
                          : ""
                      } -mt-1`}
                    >
                      {line.split("- ")[1]}
                    </label>
                  </div>
                );
              })}

            {!isPastDay(currentDayIndex) && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleFinishDayClick}
                  disabled={
                    isFutureDay(currentDayIndex) || !isCurrentDayAccessible
                  }
                >
                  Finish Day
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Confirm Finish Day
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to finish this day?
                {calculateCompletionStats().completed <
                  calculateCompletionStats().total &&
                  " Uncompleted tasks will be moved to the next day."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  finishDay();
                  confettiFireworks();
                }}
              >
                Finish Day
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

"use client";

import type * as React from "react";
import { Moon, Sun, Key, User } from "lucide-react"; // Import User icon
import { useTheme } from "next-themes";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BottomBar() {
  const [theme, themeSetter] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(true);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showApiKeyInputDialog, setShowApiKeyInputDialog] = useState(false);
  const [showPaymentPlansDialog, setShowPaymentPlansDialog] = useState(false); // State for payment plans dialog

  const checkGroqExists = () => {
    return localStorage.getItem("groqApiKey") !== null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("groqApiKey", apiKey);
    setHasApiKey(true);
    setShowApiKeyInputDialog(false);
  };

  const { setTheme } = useTheme();

  const themeSet = () => {
    themeSetter(!theme);
    if (theme) {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <div className="flex justify-center mb-16 mt-4">
      <Button variant="ghost" size="icon" onClick={() => themeSet()}>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>

      <div>
        {/* Key Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (hasApiKey && checkGroqExists()) {
              setShowConfirmationDialog(true);
            } else {
              setShowApiKeyInputDialog(true);
            }
          }}
        >
          <Key className="h-5 w-5" />
        </Button>

        {/* User Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowPaymentPlansDialog(true)}
        >
          <User className="h-5 w-5" />
        </Button>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmationDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change API Key</AlertDialogTitle>
              <AlertDialogDescription>
                You already have a Groq API key. Would you like to change it?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <div className="flex justify-between gap-4 w-full">
                <AlertDialogCancel
                  onClick={() => setShowConfirmationDialog(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowConfirmationDialog(false);
                    setShowApiKeyInputDialog(true);
                  }}
                >
                  Continue
                </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* API Key Input Dialog */}
        <AlertDialog open={showApiKeyInputDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set your Groq API key</AlertDialogTitle>
              <form onSubmit={handleSubmit} className="mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Don&apos;t have a Groq API key? Get one for free{" "}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        className="font-medium text-primary underline"
                      >
                        here
                      </a>
                    </p>
                  </div>
                  <div className="flex justify-between gap-4">
                    <AlertDialogCancel
                      onClick={() => setShowApiKeyInputDialog(false)}
                      asChild
                    >
                      <Button variant="ghost">Cancel</Button>
                    </AlertDialogCancel>
                    <Button type="submit">Save</Button>
                  </div>
                </div>
              </form>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Plans Dialog */}
        <AlertDialog open={showPaymentPlansDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Choose a Payment Plan</AlertDialogTitle>
              <AlertDialogDescription>
                Select the plan that best suits your needs.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* $2 Plan */}
              <div className="border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg">$2/month</h3>
                  <ul className="mt-2 text-sm text-muted-foreground text-center">
                    <li>Basic scheduling</li>
                    <div className="flex justify-center">
                      <div className="w-[90%] h-[0.5] bg-gray-300 my-2"></div>
                    </div>
                    <li>Plan every day of the Week</li>
                    <div className="flex justify-center">
                      <div className="w-[90%] h-[0.5] bg-gray-300 my-2"></div>
                    </div>
                    <li>Email reminders</li>
                  </ul>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => (window.location.href = "/subscription/basic")}
                >
                  Choose Plan
                </Button>
              </div>

              {/* $5 Plan */}
              <div className="border rounded-lg p-4 flex flex-col justify-between ">
                <div>
                  <h3 className="font-semibold text-lg">$5/month</h3>
                  <ul className="mt-2 text-sm text-muted-foreground text-center">
                    <li>Plan every day of the Month</li>
                    <div className="flex justify-center">
                      <div className="w-[90%] h-[0.5] bg-gray-300 my-2"></div>
                    </div>
                    <li>Email reminders</li>
                    <div className="flex justify-center">
                      <div className="w-[90%] h-[0.5] bg-gray-300 my-2"></div>
                    </div>
                    <li>Google Calendar reminders</li>
                    <div className="flex justify-center">
                      <div className="w-[90%] h-[0.5] bg-gray-300 my-2"></div>
                    </div>
                    <li>Limited retries</li>
                  </ul>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    (window.location.href = "/subscription/advanced")
                  }
                >
                  Choose Plan
                </Button>
              </div>

              {/* $10 Plan */}
              <div className="border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg">$10/month</h3>
                  <ul className="mt-2 text-sm text-muted-foreground text-center">
                    <li>Everything from lower tier plans</li>
                    <div className="flex justify-center">
                      <div className="w-[90%] h-[0.5] bg-gray-300 my-2"></div>
                    </div>
                    <li>Free access to one other app by Sehnsucht</li>
                    <div className="flex justify-center">
                      <div className="w-[90%] h-[0.5] bg-gray-300 my-2"></div>
                    </div>
                    <li>Unlimited Retries</li>
                  </ul>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    (window.location.href = "/subscription/professional")
                  }
                >
                  Choose Plan
                </Button>
              </div>
            </div>
            <AlertDialogFooter>
              <div className="flex justify-between items-center w-full">
                <p className="text-sm text-muted-foreground">
                  View other apps by{" "}
                  <a
                    href="https://example.com" // Replace with the actual URL
                    target="_blank"
                    className="font-medium underline hover:text-primary duration-200 ease-in-out"
                  >
                    Sehnsucht
                  </a>
                </p>
                <AlertDialogCancel
                  onClick={() => setShowPaymentPlansDialog(false)}
                >
                  Close
                </AlertDialogCancel>
              </div>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

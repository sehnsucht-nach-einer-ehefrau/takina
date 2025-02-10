"use client";

import type * as React from "react";
import { Moon, Sun, Settings, Key } from "lucide-react";
import { useTheme } from "next-themes";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Command, open } from "@tauri-apps/plugin-shell";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BottomBar() {
  const [theme, themeSetter] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(true); // Set this to false to disable the confirmation dialog
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false); // Controls the confirmation dialog
  const [showApiKeyInputDialog, setShowApiKeyInputDialog] = useState(false); // Controls the API key input dialog

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("API Key submitted:", apiKey);
    setShowApiKeyInputDialog(false); // Close the dialog after submission
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

  // Function to open the Groq API key registration page using Tauri's shell API
  const openGroqApiKeyPage = async () => {
    const output = await Command.create("echo", "message").execute();
    await open("https://console.groq.com/keys");
  };

  return (
    <div className="flex justify-center mb-16">
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
            if (hasApiKey) {
              setShowConfirmationDialog(true); // Open confirmation dialog if API key exists
            } else {
              setShowApiKeyInputDialog(true); // Open API key input dialog if no API key exists
            }
          }}
        >
          <Key className="h-5 w-5" />
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
                    setShowConfirmationDialog(false); // Close the confirmation dialog
                    setShowApiKeyInputDialog(true); // Open the API key input dialog
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
                      <Button
                        variant="link"
                        className="p-0 font-medium text-primary hover:underline"
                        onClick={async (e) => {
                          e.preventDefault(); // Prevent the form from submitting
                          await openGroqApiKeyPage(); // Open the link using Tauri's shell API
                        }}
                      >
                        here
                      </Button>
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
      </div>

      <Button variant="ghost" size="icon">
        <Settings />
      </Button>
    </div>
  );
}

"use client";

import Image from "next/image";
import LMG from "../../../public/icons/LMG.png"; // Ensure this is a PNG
import Pistol from "../../../public/icons/handgun_with_ammo.png"; // Ensure this is a PNG
import { useEffect, useState } from "react";

export default function Loading() {
  const [randomNumber, setRandomNumber] = useState(null);
  const [showImage, setShowImage] = useState(null);

  useEffect(() => {
    // Generate a random number between 1 and 10
    const number = Math.floor(Math.random() * 10) + 1;
    setRandomNumber(number);

    // Set the image to show based on the random number
    if (number === 10) {
      setShowImage("LMG"); // Show LMG 1 out of 10 times
    } else {
      setShowImage("Pistol"); // Show Pistol 9 out of 10 times
    }
  }, []);

  return (
    <div
      id="loading"
      className="flex flex-col items-center justify-center min-h-screen"
    >
      {/* Display the image based on the random number */}
      {showImage === "Pistol" && (
        <div className="w-32 h-32 relative ">
          <Image
            src={Pistol}
            alt="Pistol"
            width={200}
            height={200}
            unoptimized
            className="object-contain"
            draggable={false} // Disable dragging
            onContextMenu={(e) => e.preventDefault()} // Disable right-click context menu
          />
        </div>
      )}
      {showImage === "LMG" && (
        <div className="w-32 h-32 relative ">
          <Image
            src={LMG}
            alt="LMG"
            width={200}
            height={200}
            unoptimized
            className="object-contain"
            draggable={false} // Disable dragging
            onContextMenu={(e) => e.preventDefault()} // Disable right-click context menu
          />
        </div>
      )}

      {/* Loading Text */}
      <div
        className="mt-8 text-xl font-thin animate-bounce cursor-default"
        draggable={false}
      >
        Loading...
      </div>
    </div>
  );
}

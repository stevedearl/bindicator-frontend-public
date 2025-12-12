import React from "react";
import { motion } from "framer-motion";
const greenBin = new URL("../../assets/bins/bin-green.webp", import.meta.url).href;

export default function GreenBinIcon({ className = "w-24 h-24" }) {
  return (
    <motion.div
      className={`relative flex flex-col items-center ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src={greenBin}
        alt="Green garden bin"
        className="w-full h-full object-contain drop-shadow-md dark:brightness-90 transition-all duration-300"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </motion.div>
  );
}

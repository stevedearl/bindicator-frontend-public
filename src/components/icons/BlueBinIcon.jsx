import React from "react";
import { motion } from "framer-motion";
const blueBin = new URL("../../assets/bins/bin-blue.webp", import.meta.url).href;

export default function BlueBinIcon({ className = "w-24 h-24" }) {
  return (
    <motion.div
      className={`relative flex flex-col items-center ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src={blueBin}
        alt="Blue recycling bin"
        className="w-full h-full object-contain drop-shadow-md dark:brightness-90 transition-all duration-300"
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </motion.div>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatusContext } from "./OnlineStatusProvider";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatusContext();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Jste offline</span> — změny budou
              synchronizovány po připojení
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

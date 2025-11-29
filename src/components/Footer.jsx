import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchBackendVersion } from '../api/version.js';
import Button from './ui/Button.jsx';
import Modal from './ui/Modal.jsx';

export default function Footer() {
  const [versionInfo, setVersionInfo] = useState(null);
  const [openAbout, setOpenAbout] = useState(false);

  useEffect(() => {
    fetchBackendVersion().then(setVersionInfo);
  }, []);

  if (!versionInfo) return null;

  const { version, build, environment } = versionInfo;

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="mt-10 mb-4 text-center text-xs text-gray-500 dark:text-gray-400 transition-all duration-300"
    >
      <div className="flex flex-col items-center space-y-1 sm:flex-row sm:space-y-0 sm:justify-center sm:space-x-3">
        <span>Bindicator API v{version}</span>
        {build && <span>• Build: {String(build).slice(0, 7)}</span>}
        {environment && <span>• Env: {environment}</span>}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <a
          href="https://github.com/stevedearl/bindicator"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="View on GitHub"
        >
          <img src="/icons/github.svg" alt="GitHub" className="w-3.5 h-3.5 opacity-80" />
          <span>GitHub</span>
        </a>
        <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => setOpenAbout(true)}>
          About
        </Button>
      </div>

      <p className="opacity-70 mt-2">© {new Date().getFullYear()} Bindicator</p>

      <Modal open={openAbout} onClose={() => setOpenAbout(false)} title="About Bindicator">
        <p className="mb-2">Backend version details:</p>
        <pre className="text-[10px] bg-gray-50 dark:bg-gray-800 p-2 rounded-md overflow-auto max-h-48">{JSON.stringify(versionInfo, null, 2)}</pre>
      </Modal>
    </motion.footer>
  );
}


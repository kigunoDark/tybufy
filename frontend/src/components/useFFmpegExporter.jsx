import { useState, useCallback } from "react";
export const useFFmpegExporter = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const openExportModal = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const closeExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  return {
    isExportModalOpen,
    openExportModal,
    closeExportModal,
  };
};
import { useEffect } from "react";
import { updatePageMeta } from "../utils/seo";

export const usePage = (title, description) => {
  useEffect(() => {
    updatePageMeta(title, description);
  }, [title, description]);
};

export const updatePageMeta = (title, description = '') => {
  document.title = title;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && description) {
    metaDescription.setAttribute('content', description);
  }
};

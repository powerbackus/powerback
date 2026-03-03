export const regexMatchURI = (type) => {
  // Match hash from URL path, stopping at query string (?), fragment (#), or end of path
  // Example: /unsubscribe/4afafa9e0f1092a6b2?topic=district_updates
  // Should match: 4afafa9e0f1092a6b2 (not including ?topic=...)
  return window.location.href.match(RegExp(`(?<=${type}/)[^?#]*`));
};

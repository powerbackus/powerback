export default function handleFeedback(
  feedback,
  pending,
  showOverlay,
  signUpPath
) {
  return !pending && !showOverlay && signUpPath
    ? feedback.up
    : feedback.in;
}

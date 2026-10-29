// Step 1: start screen only. The road and the car come in step 2.
const startButton = document.getElementById("start-button");
const message = document.getElementById("message");

startButton.addEventListener("click", () => {
  message.hidden = false;
});

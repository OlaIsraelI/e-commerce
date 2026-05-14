export const showMessage = (msg, type = "success", timeout = 3000) => {
  let el = document.getElementById("message");

  //Create element if it doesn't exist
  if (!el) {
    el = document.createElement("div");
    el.id = "message";
    document.body.appendChild(el);
  }

  //Reset classes safely
  el.className = `message ${type}`;
  el.textContent = msg;

  //Show message
  el.style.display = "block";
  el.style.opacity = "1";

  //Auto-hide after timeout
  setTimeout(() => {
    el.style.opacity = "0";

    setTimeout(() => {
      el.style.display = "none";
    }, 300);
  }, timeout);
};
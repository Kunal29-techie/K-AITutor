const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const fileInfo = document.getElementById("fileInfo");
const errorMsg = document.getElementById("errorMsg");

// Open file picker
browseBtn.addEventListener("click", () => {
  fileInput.click();
});

// Handle file selection
fileInput.addEventListener("change", () => {
  handleFile(fileInput.files[0]);
});

// Drag events
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");

  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// File validation
function handleFile(file) {
  fileInfo.textContent = "";
  errorMsg.textContent = "";

  if (!file) return;

  if (!file.name.endsWith(".docx")) {
    errorMsg.textContent = "Only .docx files are allowed";
    return;
  }

  fileInfo.textContent = `Selected file: ${file.name}`;
  
  //  Later: upload to backend using FormData
  // uploadTranscript(file);
}

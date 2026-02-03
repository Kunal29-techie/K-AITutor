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
  handleFile(e.dataTransfer.files[0]);
});

// ===============================
// FILE HANDLER
// ===============================
function handleFile(file) {
  fileInfo.textContent = "";
  errorMsg.textContent = "";

  // Read values ONLY when needed
  const className = document.getElementById("className").value.trim();
  const studentName = document.getElementById("studentName").value.trim();
  const facultyName = document.getElementById("facultyName").value.trim();

  // Validate details first
  if (!className || !studentName || !facultyName) {
    errorMsg.textContent = "Please fill in Class, Student Name, and Faculty Name before uploading.";
    return;
  }

  if (!file) return;

  // Validate file type
  if (!file.name.toLowerCase().endsWith(".docx")) {
    errorMsg.textContent = "Only .docx files are allowed.";
    return;
  }

  // Success feedback
  fileInfo.textContent = `✔ ${file.name} uploaded for ${studentName} (${className})`;

  // 🚀 Next step (later):
  // uploadTranscript(file, { className, studentName, facultyName });
}

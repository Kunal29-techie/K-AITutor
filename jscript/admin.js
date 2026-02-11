 /* ================= CONFIG ================= */
    // Change this if your Python server runs on a different IP/Port
    const API_BASE = "http://127.0.0.1:8001"; 

    /* ================= TABS ================= */
    // function showTab(tabName) {
    //     // Content toggling
    //     document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    //     if(tabName === 'users') {
    //         document.getElementById('usersTab').classList.add('active');
    //         document.getElementById('statsSection').style.display = 'grid';
            
    //         // Nav Highlighting
    //         document.getElementById('navUser').style.color = '#3C3979';
    //         document.getElementById('navTranscript').style.color = '#334155';
    //         document.getElementById('navTranscript').style.borderBottom = 'none';
    //     } else {
    //         document.getElementById('transcriptTab').classList.add('active');
    //         document.getElementById('statsSection').style.display = 'none';
            
    //         // Nav Highlighting
    //         document.getElementById('navUser').style.color = '#334155';
    //         document.getElementById('navTranscript').style.color = '#3C3979';
    //         document.getElementById('navTranscript').style.borderBottom = '2px solid #3C3979';
    //     }
    // }





function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    const stats = document.getElementById('statsSection');
    if (stats) stats.style.display = 'none';

    const navUser = document.getElementById('navUser');
    const navTranscript = document.getElementById('navTranscript');
    const navEnterUsers = document.getElementById('navEnterUsers');

    if (navUser) navUser.style.color = '#334155';
    if (navTranscript) navTranscript.style.color = '#334155';
    if (navEnterUsers) navEnterUsers.style.color = '#334155';

    if (tabName === 'users') {
        document.getElementById('usersTab').classList.add('active');
        if (stats) stats.style.display = 'grid';
        if (navUser) navUser.style.color = '#3C3979';
    }

    if (tabName === 'transcript') {
        document.getElementById('transcriptTab').classList.add('active');
        if (navTranscript) navTranscript.style.color = '#3C3979';
    }

    if (tabName === 'enterUsers') {
        document.getElementById('enterUsersTab').classList.add('active');
        if (navEnterUsers) navEnterUsers.style.color = '#3C3979';
    }
}







    /* ================= MODAL ================= */
    function openEnrollModal() { document.getElementById('enrollModal').style.display = 'flex'; }
    function closeEnrollModal() { document.getElementById('enrollModal').style.display = 'none'; }
    window.onclick = function(e) { if(e.target == document.getElementById('enrollModal')) closeEnrollModal(); }

    /* ================= FILE HANDLING & BACKEND CONNECTION ================= */
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');

    // Display selected file name
    function updateFileName() {
        const display = document.getElementById('fileNameDisplay');
        if (fileInput.files && fileInput.files.length > 0) {
            display.textContent = "Selected: " + fileInput.files[0].name;
            display.style.color = "#166534"; // Success Green
            display.style.fontWeight = "700";
        } else {
            display.textContent = "Drag & drop your transcript here";
            display.style.color = "#1e293b";
        }
    }

    // Drag & Drop visual effects
    ['dragenter', 'dragover'].forEach(evt => {
        dropArea.addEventListener(evt, (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropArea.addEventListener(evt, (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
        });
    });

    // Handle Drop
    dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateFileName();
        }
    });

    // Handle Submit to Flask
    async function submitTranscript() {
        const btn = document.getElementById('btnUpload');
        const classVal = document.getElementById('transClass').value;
        const facultyVal = document.getElementById('transFaculty').value;
        const studentVal = document.getElementById('transStudent').value;
        const file = fileInput.files[0];

        // Validation
        if (!classVal || !facultyVal || !file) {
            alert("Please fill in Class, Faculty Name, and select a file.");
            return;
        }

        // Prepare Data for Python Backend
        const formData = new FormData();
        formData.append('class', classVal);
        formData.append('faculty_name', facultyVal);
        formData.append('student_name', studentVal); // Optional metadata
        formData.append('file', file);

        // UI Loading State
        const originalBtnContent = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/admin/upload-transcript`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                alert("✅ Success: " + result.message);
                document.getElementById('uploadForm').reset();
                updateFileName();
            } else {
                alert("❌ Server Error: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Upload Error:", error);
            alert("❌ Connection Failed. Ensure your Python backend is running on port 8001.");
        } finally {
            btn.innerHTML = originalBtnContent;
            btn.disabled = false;
        }
    }

    function logout() {
        if(confirm("Are you sure you want to logout?")) window.location.href = "login.html";
    }

    // Initialize
    showTab('users');

    //class section filters

//     function applyFilters() {
//     const school = document.getElementById("filterSchool").value.toLowerCase();
//     const classVal = document.getElementById("filterClass").value.toLowerCase();
//     const section = document.getElementById("filterSection").value.toLowerCase();
//     const roll = document.getElementById("filterRoll").value.toLowerCase();

//     const rows = document.querySelectorAll(".admin-table tbody tr");

//     rows.forEach(row => {
//         const rowText = row.textContent.toLowerCase();

//         const matchSchool = !school || rowText.includes(school);
//         const matchClass = !classVal || rowText.includes(classVal);
//         const matchSection = !section || rowText.includes(section);
//         const matchRoll = !roll || rowText.includes(roll);

//         row.style.display =
//             (matchSchool && matchClass && matchSection && matchRoll)
//             ? ""
//             : "none";
//     });
// }




function applyFilters() {
    const school = document.getElementById("filterSchool").value.toLowerCase();
    const classVal = document.getElementById("filterClass").value.toLowerCase();
    const section = document.getElementById("filterSection").value.toLowerCase();
    const roll = document.getElementById("filterRoll").value.toLowerCase();

    const rows = document.querySelectorAll(".admin-table tbody tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        const schoolCell = cells[1]?.textContent.toLowerCase();   // adjust index
        const classCell = cells[2]?.textContent.toLowerCase();
        const sectionCell = cells[3]?.textContent.toLowerCase();
        const rollCell = cells[4]?.textContent.toLowerCase();

        const matchSchool = !school || schoolCell.includes(school);
        const matchClass = !classVal || classCell.includes(classVal);
        const matchSection = !section || sectionCell.includes(section);
        const matchRoll = !roll || rollCell.includes(roll);

        row.style.display =
            (matchSchool && matchClass && matchSection && matchRoll)
            ? ""
            : "none";
    });
}

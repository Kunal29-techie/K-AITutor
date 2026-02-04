/* ================= CONFIG ================= */
// CHANGED: Empty string for relative path on EC2
const API_BASE = "https://dvbwohodr9qxd.cloudfront.net";

/* ================= AUTH ================= */
function logout() { localStorage.clear(); window.location.href = "login.html"; }
const token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

if (!token || !currentUser) window.location.href = "login.html";

/* ================= FETCH FRESH PROFILE ================= */
async function loadUserProfile() {
    try {
        const res = await fetch(`${API_BASE}/api/get-user-details`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            document.getElementById("userName").textContent = data.name;
            document.getElementById("profName").value = data.name;
            document.getElementById("profEmail").value = data.email;
            document.getElementById("profGrade").value = data.grade || "-";
            document.getElementById("profSection").value = data.section || "-";
            document.getElementById("profSchool").value = data.school || "-";
            document.getElementById("profRoll").value = data.roll_number || "-";
            
            document.getElementById("profHobbies").value = data.hobbies || "";
            document.getElementById("profLang").value = data.preferred_language || "English";

            currentUser = { ...currentUser, ...data };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }
    } catch (e) {
        console.error("Failed to load fresh profile:", e);
        document.getElementById("profRoll").value = currentUser.roll_number || "-";
    }
}

/* ================= CHAT FORMATTER ================= */
function formatChat(text) {
    if (!text) return "";
    let cleanText = text.replace(/^###\s*/gm, "").replace(/^##\s*/gm, "");
    const lines = cleanText.split('\n');
    let html = "";
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        let content = line.replace(/^[\d]+[\.\)]\s*/, "").replace(/^[1-5]️⃣\s*/, "").trim();
        
        if (content.match(/Question \d+/i)) {
            content = content.replace(/\*\*(.*?)\*\*/g, "$1");
            html += `<div class="question-header">${content}</div>`;
        } else if (content.match(/^[A-D]\.\s/)) {
            const letter = content.charAt(0);
            html += `<button class="chat-option-btn" onclick="sendOption('${letter}')"><strong>${letter}.</strong> ${content.substring(2)}</button>`;
        } else if (content.includes("Excellent work") || content.includes("That’s correct")) {
            html += `<div class="feedback-success">${content}</div>`;
        } else if (content.toLowerCase().startsWith("that answer is wrong") || content.toLowerCase().includes("incorrect") || content.toLowerCase().includes("not correct")) {
            html += `<div class="feedback-error">${content}</div>`;
        } else {
            content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
            content = content.replace(/(https?:\/\/[^\s<]+)/g, function(url) {
                return url.includes('href') ? url : `<a href="${url}" target="_blank">${url}</a>`;
            });
            content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            html += `<div class="chat-text">${content}</div>`;
        }
    });
    return html;
}

window.sendOption = function(optionValue) {
    const input = document.getElementById("chatInput");
    input.value = optionValue;
    document.getElementById("chatForm").dispatchEvent(new Event('submit'));
}

/* ================= CHAT LOGIC ================= */
let sessionId = null;
let waiting = false;

async function startSession() {
    try {
        const res = await fetch(`${API_BASE}/api/start`, { method: "POST", headers: { "Authorization": `Bearer ${token}` } });
        const data = await res.json();
        sessionId = data.session_id;
        addAIMessage(data.answer);
    } catch (e) { console.error("Session Error:", e); }
}

async function sendMessage(msg) {
    if (!sessionId || waiting) return;
    waiting = true;
    try {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ session_id: sessionId, message: msg })
        });
        const data = await res.json();
        addAIMessage(data.answer);
        waiting = false;
        
        // CHANGED: Detect "Assessment Completed" notification OR original report header
        if (data.answer && (data.answer.includes("FINAL COMPETENCY REPORT") || data.answer.includes("Assessment Completed"))) {
            await loadHistory();
            await loadStats();
        }
    } catch (e) { console.error("Chat Error:", e); waiting = false; }
}

const chatForm = document.getElementById("chatForm");
if(chatForm) {
    chatForm.addEventListener("submit", async e => {
        e.preventDefault();
        const input = document.getElementById("chatInput");
        const msg = input.value.trim();
        if (!msg) return;
        addUserMessage(msg);
        input.value = "";
        await sendMessage(msg);
    });
}

function addUserMessage(text) { 
    const div = document.createElement("div");
    div.className = "chat-message user";
    div.textContent = text;
    document.getElementById("chatMessages").appendChild(div);
    scrollToBottom();
}

function addAIMessage(text) { 
    const div = document.createElement("div");
    div.className = "chat-message assistant";
    div.innerHTML = formatChat(text);
    document.getElementById("chatMessages").appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    const chatDiv = document.getElementById("chatMessages");
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

/* ================= REATTEMPT LOGIC ================= */
function startReattempt(subject) {
    showTab('chat');
    const chatInput = document.getElementById("chatInput");
    chatInput.value = subject;
    chatInput.focus();
}

/* ================= LOAD HISTORY ================= */
async function loadHistory() {
    try {
        const res = await fetch(`${API_BASE}/api/assessment-history`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.status === 401 || res.status === 403) { logout(); return; }
        const data = await res.json();
        const list = document.getElementById("assessmentsList");
        if(list) {
            list.innerHTML = "";
            if (!data || data.length === 0) { list.innerHTML = "<p style='text-align:center;'>No assessments yet.</p>"; return; }
            data.forEach(r => {
                if (!r || !r.report_markdown) return;
                const reportHTML = renderReportUI(r.report_markdown, r.subject);
                const reportId = `rep-${r.report_id}`;
                const dateOnly = new Date(r.date).toLocaleDateString();
                
                list.innerHTML += `
                    <div class="history-card">
                        <div class="history-header">
                            <div class="header-left">
                                <h4 class="subject-title">${r.subject}</h4>
                                <div class="history-date">${dateOnly}</div>
                            </div>
                            <div class="header-right">
                                <button class="btn-outline" onclick="toggleReport('${reportId}')">
                                    <i class="fa-solid fa-eye"></i> View Report
                                </button>
                                <button class="btn-outline" onclick="downloadPDF('${r.report_id}')">
                                    <i class="fa-solid fa-download"></i> Download PDF
                                </button>
                            </div>
                        </div>
                        <div id="${reportId}" class="report-container">${reportHTML}</div>
                    </div>`;
            });
        }
    } catch(err) { console.error(err); }
}

function toggleReport(id) {
    const el = document.getElementById(id);
    if (!el) return;
    document.querySelectorAll('.report-container').forEach(div => { if(div.id !== id) div.style.display = 'none'; });
    el.style.display = (el.style.display === "block") ? "none" : "block";
}

async function downloadPDF(id) {
    try {
        const res = await fetch(`${API_BASE}/api/assessment-report-pdf/${id}`, { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error("Server error");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Assessment_Report.pdf"; 
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) { alert("Unable to download PDF."); console.error(err); }
}

/* ================= REPORT UI HELPERS (UPDATED) ================= */
function extractScore(text, label) {
    if (!text) return { scored: 0, total: 0, percent: 0 };
    const regex = new RegExp(`${label}:\\s*(\\d+)\\s*\\/\\s*(\\d+)`, "i");
    const match = text.match(regex);
    if (match) return { scored: parseInt(match[1]), total: parseInt(match[2]), percent: (parseInt(match[1]) / parseInt(match[2])) * 100 };
    return { scored: 0, total: 0, percent: 0 };
}

function formatDetailedAnalysis(text) {
    if (!text) return "";
    let lines = text.split('\n');
    let html = "";
    let insideFeedback = false;
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        // Stop processing at bottom sections
        if (line.includes("ACHIEVEMENT BADGE") || line.includes("FINAL FEEDBACK") || line.includes("📌")) { 
            insideFeedback = true; 
        }
        if (insideFeedback) return;

        // --- FILTERING START: Remove Summary Block & Success Messages ---
        if (line.includes("FINAL COMPETENCY REPORT") || 
            line.includes("ASSESSMENT SUMMARY") || 
            line.startsWith("---") || 
            line.startsWith("📊") || 
            line.startsWith("📝")) return;

        // Skip specific summary text
        if (
            line.includes("Here is your final competency report") ||
            line.startsWith("Final Competency Level:") ||
            (line.startsWith("-") && (
                line.includes("Questions Attempted") ||
                line.includes("Level:") ||
                line.includes("Correct Answers") ||
                line.includes("Incorrect Answers") ||
                line.includes("Remediation Used")
            ))
        ) return;

        // Skip Success Messages
        if (
            line.includes("Excellent work") || 
            line.includes("That’s correct") || 
            line.includes("thinking in the right direction")
        ) return;
        
        // --- FILTERING END ---
        
        // Rendering
        if (line.match(/^Question\s+\d+/i)) { 
            html += `<div class="question-header">${line}</div>`; 
        }
        else if (line.match(/^[A-D]\./)) { 
            html += `<div style="margin-left:15px; margin-bottom:4px;"><span class="option-letter">${line.substring(0, 2)}</span>${line.substring(2)}</div>`; 
        }
        else if (line.includes("Result:")) {
            line = line.replace("Result:", '<span class="report-label">Result:</span>');
            if (line.toLowerCase().includes("correct") && !line.toLowerCase().includes("incorrect")) { 
                line = line.replace(/Correct/i, '<span class="result-correct">Correct</span>'); 
            } else { 
                line = line.replace(/Incorrect/i, '<span class="result-incorrect">Incorrect</span>'); 
            }
            html += `<div>${line}</div>`;
        } else { 
            html += `<div>${line}</div>`; 
        }
    });
    return html;
}

function renderReportUI(markdown, subjectName) {
    if (!markdown) return "<p>Report missing.</p>";
    
    let badgeName = "Bronze Starter Badge"; let trophy = "🥉";
    if (markdown.includes("Intermediate")) { badgeName = "Intermediate Thinker Badge"; trophy = "🥈"; }
    if (markdown.includes("Mastery")) { badgeName = "Concept Mastery Badge"; trophy = "🏆"; }
    
    const easy = extractScore(markdown, "Easy Level");
    const inter = extractScore(markdown, "Intermediate Level");
    const hard = extractScore(markdown, "Mastery Level");
    
    let totalCorrect = "0";
    const correctMatch = markdown.match(/Total Correct Answers:\s*(\d+)/i);
    if (correctMatch) totalCorrect = correctMatch[1];

    return `
        <div class="report-summary-grid">
            <div class="stat-box">
                <div class="stat-label">Badge Earned</div>
                <div class="badge-text">${badgeName}</div>
                <div style="font-size:24px; margin-top:5px;">${trophy}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Total Correct</div>
                <div class="stat-value" style="color:#10b981;">${totalCorrect}</div>
            </div>
            <div class="stat-box reattempt-box" onclick="startReattempt('${subjectName}')">
                <div class="stat-label">Action</div>
                <div class="reattempt-icon"><i class="fa-solid fa-rotate-right"></i></div>
                <div style="font-size:14px; font-weight:700; color:#6366f1; margin-top:5px;">Reattempt Assessment</div>
            </div>
        </div>
        <div class="level-progress-container">
            <div style="margin-bottom:20px; font-weight:700; font-size:12px; color:#64748b;">Performance Breakdown</div>
            <div class="progress-row"><div class="progress-label">Easy</div><div class="progress-track"><div class="progress-fill fill-easy" style="width: ${easy.percent}%"></div></div></div>
            <div class="progress-row"><div class="progress-label">Intermediate</div><div class="progress-track"><div class="progress-fill fill-inter" style="width: ${inter.percent}%"></div></div></div>
            <div class="progress-row"><div class="progress-label">Mastery</div><div class="progress-track"><div class="progress-fill fill-hard" style="width: ${hard.percent}%"></div></div></div>
        </div>
        <div class="questions-section"><h3>Detailed Analysis</h3><div class="raw-content">${formatDetailedAnalysis(markdown)}</div></div>
    `;
}

/* ================= INIT ================= */
const btnEdit = document.getElementById('btnEditProfile');
const inputHobbies = document.getElementById('profHobbies');
const inputLang = document.getElementById('profLang');
let isEditing = false; 

if(btnEdit) {
    btnEdit.addEventListener('click', async () => {
        if (!isEditing) {
            isEditing = true;
            inputHobbies.disabled = false; inputLang.disabled = false; inputHobbies.focus();
            btnEdit.textContent = "Save Changes";
            btnEdit.style.backgroundColor = "#3C3979"; btnEdit.style.color = "white";
        } else {
            try {
                const res = await fetch(`${API_BASE}/update-profile`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ hobbies: inputHobbies.value, language: inputLang.value })
                });
                if(res.ok) {
                    inputHobbies.disabled = true; inputLang.disabled = true;
                    isEditing = false;
                    btnEdit.textContent = "Edit Profile";
                    btnEdit.style.backgroundColor = "white"; btnEdit.style.color = "#3C3979";
                }
            } catch(e) { console.error("Update Error:", e); }
        }
    });
}

async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/api/dashboard-stats`, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const stats = await res.json();
            document.getElementById("statChats").innerText = stats.total_chats;
            document.getElementById("statAssessments").innerText = stats.total_assessments;
            document.getElementById("statAvgScore").innerText = stats.average_score + "%";
            document.getElementById("statStreak").innerText = stats.day_streak;
        }
    } catch (e) { console.error("Stats Error:", e); }
}

function showTab(tab) {
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(tab + "Tab").classList.add("active");
    const btn = [...document.querySelectorAll(".tab-btn")].find(b => b.textContent.toLowerCase().includes(tab));
    if (btn) btn.classList.add("active");
    if (tab === "assessments") loadHistory();
    if (tab === "profile") {
        loadStats();
        loadUserProfile();
    }
}

window.onload = async () => {
    await startSession();
    await loadStats();
    await loadUserProfile();
};
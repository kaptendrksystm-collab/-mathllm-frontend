
const API_BASE = "";
const STORAGE_KEY = "mathllm_learning_history";

let currentSessionId = null;
let questions = [];
let currentIndex = 0;
let selectedAnswer = null;
let answered = false;

const workspace = document.querySelector(".workspace");

// ==========================================
// API REQUEST
// ==========================================

// ==========================================
// LOADING INDICATOR
// ==========================================

function showLoading(container, message) {
    if (!container) return null;

    const loading = document.createElement("div");
    loading.className = "loading-indicator";
    loading.setAttribute("role", "status");
    loading.setAttribute("aria-live", "polite");

    loading.innerHTML = `
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(loading);

    return loading;
}

function hideLoading(loading) {
    if (loading) {
        loading.remove();
    }
}

async function apiRequest(path, options = {}) {
    let response;

    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });
    } catch (error) {
        throw new Error(
            "Tidak dapat terhubung ke server MathLLM. " +
            "Pastikan aplikasi FastAPI sedang berjalan."
        );
    }

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            "Server memberikan respons yang tidak dapat dibaca."
        );
    }

    if (!response.ok) {
        const detail = data.detail;

        if (typeof detail === "string" && detail.trim()) {
            throw new Error(detail);
        }

        throw new Error(
            `Terjadi kesalahan pada server (kode ${response.status}).`
        );
    }

    return data;
}

// ==========================================
// NAVIGASI
// ==========================================

function setActiveNav(page) {
    const homeNav = document.getElementById("home-nav");
    const historyNav = document.getElementById("history-nav");

    if (!homeNav || !historyNav) return;

    homeNav.classList.toggle("active", page === "home");
    historyNav.classList.toggle("active", page === "history");

    if (page === "home") {
        homeNav.setAttribute("aria-current", "page");
        historyNav.removeAttribute("aria-current");
    } else {
        historyNav.setAttribute("aria-current", "page");
        homeNav.removeAttribute("aria-current");
    }
}

function updateBreadcrumb(page) {
    const breadcrumb = document.getElementById("breadcrumb");
    if (!breadcrumb) return;

    const labels = {
        home: "MathLLM / Beranda",
        history: "MathLLM / Riwayat Soal",
        exercise: "MathLLM / Latihan",
        result: "MathLLM / Hasil Latihan"
    };

    breadcrumb.textContent = labels[page] || "MathLLM";
}

document.getElementById("home-nav").addEventListener("click", event => {
    event.preventDefault();
    renderSetup();
});

document.getElementById("new-chat-button").addEventListener("click", () => {
    renderSetup();
});

document.getElementById("history-nav").addEventListener("click", event => {
    event.preventDefault();
    renderHistory();
});

// ==========================================
// PESAN STATUS
// ==========================================

function showMessage(message, isError = false) {
    if (!workspace) return;

    let box = document.getElementById("app-message");

    if (!box) {
        box = document.createElement("p");
        box.id = "app-message";
        workspace.prepend(box);
    }

    box.textContent = message;
    box.className = isError
        ? "app-message-error"
        : "app-message";

    box.setAttribute(
        "role",
        isError ? "alert" : "status"
    );

    box.setAttribute("aria-live", "polite");
}

// ==========================================
// DASHBOARD
// ==========================================

function renderSetup() {
    setActiveNav("home");
    updateBreadcrumb("home");

    workspace.innerHTML = `
        <section class="dashboard-hero">
            <div class="hero-content">
                <span class="hero-label">
                    ✨ MATHLLM LEARNING PLATFORM
                </span>

                <h1>Ayo, jadi jago <span>matematika!</span></h1>

                <p>
                    Belajar matematika menjadi lebih menyenangkan.
                    Selesaikan soal latihan, periksa jawaban,
                    dan pahami setiap langkah penyelesaiannya.
                </p>

                <button id="start-button" class="primary-cta" type="button">
                    Mulai Latihan 10 Soal <span>→</span>
                </button>
            </div>

            <div class="hero-decoration" aria-hidden="true">
                <span class="math-symbol symbol-one">+</span>
                <span class="math-symbol symbol-two">×</span>
                <span class="math-symbol symbol-three">÷</span>
                <span class="math-symbol symbol-four">π</span>
                <div class="math-circle"><span>∑</span></div>
            </div>
        </section>

        <section class="learning-stats">
            <article class="stat-card stat-blue">
                <span class="stat-icon">📝</span>
                <div>
                    <strong>10 Soal</strong>
                    <small>Setiap sesi latihan</small>
                </div>
            </article>

            <article class="stat-card stat-purple">
                <span class="stat-icon">🎯</span>
                <div>
                    <strong>3 Tingkat</strong>
                    <small>Mudah, sedang, sulit</small>
                </div>
            </article>

            <article class="stat-card stat-green">
                <span class="stat-icon">💡</span>
                <div>
                    <strong>Pembahasan</strong>
                    <small>Pelajari jawabanmu</small>
                </div>
            </article>
        </section>

        <section class="learning-section">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">MULAI BELAJAR</p>
                    <h2>Siap mengasah kemampuanmu?</h2>
                </div>
                <span class="section-decoration">✦</span>
            </div>

            <div class="mode-grid">
                <article class="mode-card mode-blue">
                    <div class="mode-icon">＋</div>
                    <h3>Latihan Matematika</h3>
                    <p>
                        Kerjakan soal pilihan ganda dari berbagai
                        operasi matematika.
                    </p>
                    <span class="mode-tag">Latihan Otomatis</span>
                </article>

                <article class="mode-card mode-yellow">
                    <div class="mode-icon">★</div>
                    <h3>Tantangan Bertahap</h3>
                    <p>
                        Asah kemampuanmu melalui soal dengan
                        tingkat kesulitan berbeda.
                    </p>
                    <span class="mode-tag">Mudah • Sedang • Sulit</span>
                </article>
            </div>
        </section>

        <section class="learning-tip">
            <div class="tip-icon">💡</div>
            <div>
                <strong>Tips belajar hari ini</strong>
                <p>
                    Jangan takut melakukan kesalahan.
                    Setiap soal adalah kesempatan untuk menjadi lebih baik!
                </p>
            </div>
        </section>

        <p id="app-message" role="status"></p>
    `;

    document.getElementById("start-button")
        .addEventListener("click", startSession);
}

// ==========================================
// MEMULAI SESI LATIHAN
// ==========================================


function startSession() {
    showMessage(
        "Fitur latihan interaktif MathLLM sedang dalam pengembangan. Silakan nantikan pembaruan berikutnya."
    );
}


// ==========================================
// MENAMPILKAN SOAL
// ==========================================

function renderQuestion() {
    const question = questions[currentIndex];

    if (!question) {
        showMessage("Soal tidak ditemukan.", true);
        return;
    }

    selectedAnswer = null;
    answered = false;

    setActiveNav("home");
    updateBreadcrumb("exercise");

    const totalQuestions = questions.length;
    const currentQuestion = currentIndex + 1;
    const progress = (currentQuestion / totalQuestions) * 100;

    const choicesHTML = (question.choices || []).map((choice, index) => `
        <button
            class="answer-choice"
            type="button"
            data-index="${index}"
        >
            <strong>${String.fromCharCode(65 + index)}.</strong>
            ${escapeHTML(String(choice))}
        </button>
    `).join("");

    workspace.innerHTML = `
        <div class="welcome">
            <p class="eyebrow">LATIHAN MATEMATIKA</p>

            <h1>
                Soal ${currentQuestion}
                <span>dari ${totalQuestions}</span>
            </h1>

            <p class="welcome-description">
                Operasi: ${escapeHTML(operationLabel(question.operation))}
                · Kesulitan: ${escapeHTML(difficultyLabel(question.difficulty))}
            </p>
        </div>

        <section class="exercise-progress">
            <div class="progress-info">
                <span>Progres Latihan</span>
                <strong>${currentQuestion} / ${totalQuestions}</strong>
            </div>

            <div
                class="progress-track"
                role="progressbar"
                aria-label="Progres latihan"
                aria-valuemin="0"
                aria-valuemax="${totalQuestions}"
                aria-valuenow="${currentQuestion}"
            >
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>

            <div class="progress-caption">
                <span>Terus semangat mengerjakan!</span>
                <span>${Math.round(progress)}%</span>
            </div>
        </section>

        <section class="chat-area">
            <p class="question-number">
                PERTANYAAN ${currentQuestion}
            </p>

            <h2>${escapeHTML(question.question || "")}</h2>

            <div class="answer-list">
                ${choicesHTML}
            </div>

            <p id="feedback" role="status"></p>

            <div class="exercise-actions">
                <button id="check-button" type="button" disabled>
                    Periksa Jawaban
                </button>

                <button id="next-button" type="button" hidden>
                    ${currentIndex === totalQuestions - 1
                        ? "Lihat Nilai"
                        : "Soal Berikutnya"}
                </button>
            </div>
        </section>
    `;

    document.querySelectorAll(".answer-choice").forEach(button => {
        button.addEventListener("click", () => {
            if (answered) return;

            document.querySelectorAll(".answer-choice")
                .forEach(item => item.classList.remove("selected"));

            button.classList.add("selected");

            selectedAnswer = String.fromCharCode(
                65 + Number(button.dataset.index)
            );

            document.getElementById("check-button").disabled = false;
        });
    });

    document.getElementById("check-button")
        .addEventListener("click", checkAnswer);

    document.getElementById("next-button")
        .addEventListener("click", nextQuestion);
}

// ==========================================
// MEMERIKSA JAWABAN
// ==========================================



function checkAnswer() {
    showMessage(
        "Pemeriksaan jawaban otomatis belum tersedia pada versi demo ini. Fitur tersebut akan hadir pada pengembangan berikutnya."
    );
}



// ==========================================
// SOAL BERIKUTNYA
// ==========================================

async function nextQuestion() {
    if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
        return;
    }

    const button = document.getElementById("next-button");

    if (button) {
        button.disabled = true;
        button.textContent = "Menghitung hasil...";
    }

    await renderResult();
}

// ==========================================
// PENYIMPANAN RIWAYAT
// ==========================================

function getHistory() {
    try {
        const history = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(history) ? history : [];

    } catch (error) {
        console.error("Gagal membaca riwayat:", error);
        return [];
    }
}

function saveHistory(result) {
    try {
        let history = getHistory();

        const record = {
            ...result,
            session_id: currentSessionId,
            saved_at: new Date().toISOString()
        };

        history = history.filter(item =>
            item.session_id !== currentSessionId
        );

        history.unshift(record);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(history)
        );

        return true;

    } catch (error) {
        console.error("Gagal menyimpan riwayat:", error);
        return false;
    }
}

// ==========================================
// HALAMAN RIWAYAT SOAL
// ==========================================

function renderHistory() {
    setActiveNav("history");
    updateBreadcrumb("history");

    const history = getHistory();

    if (history.length === 0) {
        workspace.innerHTML = `
            <div class="welcome">
                <p class="eyebrow">RIWAYAT PEMBELAJARAN</p>

                <h1>
                    Riwayat <span>Latihan</span>
                </h1>

                <p class="welcome-description">
                    Belum ada sesi latihan yang tersimpan.
                    Selesaikan latihan pertamamu untuk melihat
                    riwayat dan pembahasannya di sini.
                </p>

                <button id="history-home-button" type="button">
                    Mulai Latihan
                </button>
            </div>
        `;

        document.getElementById("history-home-button")
            .addEventListener("click", renderSetup);

        return;
    }

    const totalSessions = history.length;

    const averagePercentage = Math.round(
        history.reduce((sum, item) => {
            return sum + getResultPercentage(item);
        }, 0) / totalSessions
    );

    const historyHTML = history.map((item, index) => {
        const date = formatDate(item.saved_at);
        const score = Number(item.score) || 0;
        const total = Number(item.total) || 0;
        const percentage = getResultPercentage(item);

        return `
            <article class="result-item history-card">
                <div class="history-card-info">
                    <p class="eyebrow">SESI LATIHAN ${totalSessions - index}</p>

                    <h3>${escapeHTML(date)}</h3>

                    <p>
                        Nilai:
                        <strong>${score}/${total}</strong>
                        <span class="history-percentage">
                            ${percentage}% benar
                        </span>
                    </p>
                </div>

                <button
                    class="history-detail-button"
                    type="button"
                    data-history-index="${index}"
                >
                    Lihat Pembahasan →
                </button>
            </article>
        `;
    }).join("");

    workspace.innerHTML = `
        <div class="welcome">
            <p class="eyebrow">RIWAYAT PEMBELAJARAN</p>

            <h1>
                Riwayat <span>Latihan</span>
            </h1>

            <p class="welcome-description">
                Lihat kembali hasil latihan dan pelajari
                pembahasan dari sesi sebelumnya.
            </p>
        </div>

        <section class="history-overview">
            <article class="history-overview-card">
                <span class="history-overview-icon">📚</span>
                <div>
                    <strong>${totalSessions}</strong>
                    <span>Total sesi latihan</span>
                </div>
            </article>

            <article class="history-overview-card">
                <span class="history-overview-icon">📈</span>
                <div>
                    <strong>${averagePercentage}%</strong>
                    <span>Rata-rata keberhasilan</span>
                </div>
            </article>
        </section>

        <section class="chat-area">
            <div class="section-heading">
                <div>
                    <h2>Latihan Sebelumnya</h2>
                    <p>${totalSessions} sesi latihan tersimpan</p>
                </div>
            </div>

            <div class="history-list">
                ${historyHTML}
            </div>
        </section>
    `;

    document.querySelectorAll(".history-detail-button")
        .forEach(button => {
            button.addEventListener("click", () => {
                const index = Number(button.dataset.historyIndex);
                openHistoryRecord(index);
            });
        });
}

// ==========================================
// MEMBUKA DETAIL RIWAYAT
// ==========================================

function openHistoryRecord(index) {
    const history = getHistory();
    const record = history[index];

    if (!record) {
        showMessage("Riwayat latihan tidak ditemukan.", true);
        return;
    }

    renderResultContent(record, true);
}

// ==========================================
// MENGAMBIL HASIL LATIHAN
// ==========================================

 
function renderResult() {
    showMessage(
        "Hasil latihan belum tersedia pada versi demo ini karena memerlukan koneksi ke server MathLLM."
    );
}


// ==========================================
// TAMPILAN DETAIL HASIL
// ==========================================

function renderResultContent(result, fromHistory = false) {
    setActiveNav(fromHistory ? "history" : "home");
    updateBreadcrumb(fromHistory ? "history" : "result");

    const details = Array.isArray(result.details)
        ? result.details
        : [];

    const score = Number(result.score) || 0;
    const total = Number(result.total) || details.length;
    const percentage = getResultPercentage(result);
    const wrong = Math.max(0, total - score);

    let performanceTitle = "Tetap semangat belajar!";
    let performanceDescription =
        "Terus berlatih dan pelajari pembahasan setiap soal.";

    if (percentage >= 90) {
        performanceTitle = "Luar biasa! 🎉";
        performanceDescription =
            "Pemahaman matematikamu sangat baik. Pertahankan prestasimu!";
    } else if (percentage >= 75) {
        performanceTitle = "Hasil yang bagus! 🌟";
        performanceDescription =
            "Kamu sudah menguasai sebagian besar soal. Terus tingkatkan kemampuanmu!";
    } else if (percentage >= 60) {
        performanceTitle = "Terus berkembang! 💪";
        performanceDescription =
            "Kamu sudah berada di jalur yang tepat. Pelajari kembali soal yang belum tepat.";
    }

    const detailsHTML = details.map((item, index) => {
        const isCorrect = Boolean(item.correct);

        return `
            <article class="result-item answer-review ${isCorrect
                ? "review-correct"
                : "review-incorrect"}">

                <div class="review-heading">
                    <span class="review-question-label">
                        SOAL ${index + 1}
                    </span>

                    <span class="review-status ${isCorrect
                        ? "status-correct"
                        : "status-incorrect"}">
                        ${isCorrect ? "✓ Benar" : "✕ Belum tepat"}
                    </span>
                </div>

                <h3>${escapeHTML(item.question || "Soal tidak tersedia")}</h3>

                <div class="review-answer-grid">
                    <div class="review-answer-box">
                        <span>Jawabanmu</span>
                        <strong>
                            ${escapeHTML(
                                item.your_answer == null
                                    ? "Tidak dijawab"
                                    : String(item.your_answer)
                            )}
                        </strong>
                    </div>

                    <div class="review-answer-box">
                        <span>Kunci jawaban</span>
                        <strong>
                            ${escapeHTML(String(item.correct_answer ?? "-"))}
                        </strong>
                    </div>
                </div>

                <div class="review-explanation">
                    <strong>💡 Pembahasan</strong>
                    <p>
                        ${escapeHTML(
                            item.explanation || "Tidak ada pembahasan."
                        )}
                    </p>
                </div>
            </article>
        `;
    }).join("");

    workspace.innerHTML = `
        <section class="result-hero">
            <div class="result-hero-heading">
                <p class="eyebrow">
                    ${fromHistory ? "DETAIL RIWAYAT" : "LATIHAN SELESAI"}
                </p>

                <h1>${performanceTitle}</h1>

                <p>${performanceDescription}</p>
            </div>

            <div class="result-score-panel">
                <div
                    class="score-circle"
                    style="--score-progress: ${percentage}%"
                    role="img"
                    aria-label="Persentase keberhasilan ${percentage} persen"
                >
                    <div class="score-circle-inner">
                        <strong>${percentage}%</strong>
                        <span>Keberhasilan</span>
                    </div>
                </div>

                <div class="score-main">
                    <span>Skor Akhir</span>
                    <strong>${score}<small>/${total}</small></strong>
                    <p>${percentage}% jawaban benar</p>
                </div>
            </div>
        </section>

        <section class="result-summary">
            <article class="summary-card summary-blue">
                <span class="summary-icon">📝</span>
                <div>
                    <strong>${total}</strong>
                    <span>Total soal</span>
                </div>
            </article>

            <article class="summary-card summary-green">
                <span class="summary-icon">✓</span>
                <div>
                    <strong>${score}</strong>
                    <span>Jawaban benar</span>
                </div>
            </article>

            <article class="summary-card summary-yellow">
                <span class="summary-icon">↻</span>
                <div>
                    <strong>${wrong}</strong>
                    <span>Belum tepat</span>
                </div>
            </article>
        </section>

        <div class="result-actions">
            ${
                fromHistory
                    ? `<button id="back-history-button" type="button">
                           ← Kembali ke Riwayat
                       </button>`
                    : `<button id="restart-button" type="button">
                           Latihan Baru →
                       </button>`
            }
        </div>

        <section class="result-review-section">
            <div class="section-heading">
                <div>
                    <p class="eyebrow">EVALUASI PEMBELAJARAN</p>
                    <h2>Pembahasan Jawaban</h2>
                    <p>Pelajari kembali setiap soal dan pahami langkah penyelesaiannya.</p>
                </div>
            </div>

            <div class="review-list">
                ${
                    detailsHTML ||
                    "<p>Detail pembahasan belum tersedia.</p>"
                }
            </div>
        </section>
    `;

    if (fromHistory) {
        document.getElementById("back-history-button")
            .addEventListener("click", renderHistory);
    } else {
        document.getElementById("restart-button")
            .addEventListener("click", renderSetup);
    }
}

// ==========================================
// FUNGSI PENDUKUNG
// ==========================================

function getResultPercentage(result) {
    if (result.percentage !== undefined && result.percentage !== null) {
        return Math.min(100, Math.max(0, Number(result.percentage) || 0));
    }

    const score = Number(result.score) || 0;
    const total = Number(result.total) || 0;

    if (total <= 0) return 0;

    return Math.round((score / total) * 100);
}

function formatDate(value) {
    if (!value) return "Tanggal tidak tersedia";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Tanggal tidak tersedia";
    }

    return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function operationLabel(value) {
    return {
        addition: "Penjumlahan",
        subtraction: "Pengurangan",
        multiplication: "Perkalian",
        division: "Pembagian"
    }[value] || value || "-";
}

function difficultyLabel(value) {
    return {
        easy: "Mudah",
        medium: "Sedang",
        hard: "Sulit"
    }[value] || value || "-";
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ==========================================
// MENJALANKAN APLIKASI
// ==========================================

renderSetup();

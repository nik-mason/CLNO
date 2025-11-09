// Global state to store session information
const appState = {
    schoolId: null, schoolName: null, grade: null,
    classNum: null, password: null, role: null,
    attendanceNum: null,
};

// --- Modal & Page Navigation ---
const modal = document.getElementById('modal');
function showModal(message) {
    modal.querySelector('#modal-message').textContent = message;
    modal.style.display = 'flex';
}
function hideModal() { modal.style.display = 'none'; }
modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.matches('#modal-close-btn')) hideModal();
});

function showPage(pageId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
    }
}

// --- API Fetch Functions ---
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '알 수 없는 오류가 발생했습니다.' }));
            throw new Error(error.message);
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error at ${endpoint}:`, error);
        showModal(error.message);
        return null;
    }
}

// --- UI Rendering and Setup ---
function renderSchoolList(schools) {
    const schoolListUl = document.getElementById('school-list');
    schoolListUl.innerHTML = '';
    schools.forEach(school => {
        const li = document.createElement('li');
        li.className = 'school-item';
        li.innerHTML = `<span>${school.name}</span><button class="select-button" data-school-id="${school.id}" data-school-name="${school.name}">선택</button>`;
        schoolListUl.appendChild(li);
    });
}

function setupGradeButtons() {
    const container = document.getElementById('grade-selection-buttons');
    container.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'clno-button secondary-btn';
        button.textContent = `${i}`;
        button.dataset.grade = i;
        container.appendChild(button);
    }
}

// --- App Initialization & Event Listeners ---
function setupEventListeners() {
    // School Selection
    document.getElementById('school-list').addEventListener('click', e => {
        if (e.target.matches('.select-button')) {
            appState.schoolId = e.target.dataset.schoolId;
            appState.schoolName = e.target.dataset.schoolName;
            showPage('class-input-screen');
        }
    });

    // Grade/Class Input
    document.getElementById('grade-selection-buttons').addEventListener('click', e => {
        if (e.target.matches('.clno-button')) {
            document.querySelectorAll('#grade-selection-buttons .clno-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            appState.grade = e.target.dataset.grade;
        }
    });

    document.getElementById('class-input-form').addEventListener('submit', async e => {
        e.preventDefault();
        if (!appState.grade) { showModal('학년을 선택하세요.'); return; }
        const classNum = document.getElementById('input-class').value;
        const password = document.getElementById('input-password').value;
        const result = await apiCall('/api/verify/class', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schoolId: appState.schoolId, grade: appState.grade, class: classNum, password })
        });
        if (result?.success) {
            appState.classNum = classNum;
            showPage('role-selection-screen');
        }
    });

    // Role Selection
    document.getElementById('role-selection-screen').addEventListener('click', e => {
        const button = e.target.closest('.role-button');
        if (button) {
            appState.role = button.dataset.role;
            showPage(appState.role === 'student' ? 'student-login-screen' : 'teacher-login-screen');
        }
    });

    // Student Login
    document.getElementById('student-login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const attendanceNum = document.getElementById('input-attendance-number').value;
        const pin = document.getElementById('input-student-pin').value;
        const result = await apiCall('/api/login/student', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...appState, attendanceNum, pin })
        });
        if (result?.success) {
            appState.attendanceNum = attendanceNum;
            showPage('student-main-screen');
        }
    });

    // Teacher Login
    document.getElementById('teacher-login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const password = document.getElementById('login-teacher-password').value;
        const result = await apiCall('/api/login/teacher', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        if (result?.success) showPage('teacher-main-screen');
    });
}

// Restoring the robust startup logic
window.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const appLogo = document.getElementById('app-logo');

    // Re-enabling animations
    document.querySelectorAll('.screen').forEach(s => s.classList.add('animated-screen'));

    // Start fetching data right away
    const schoolsPromise = apiCall('/api/schools');

    // When the logo animation ends, start fading out the splash screen
    appLogo.addEventListener('animationend', () => {
        splashScreen.style.opacity = '0';
    }, { once: true });

    // When the splash screen fade-out is done, hide it
    splashScreen.addEventListener('transitionend', () => {
        splashScreen.style.display = 'none';
    }, { once: true });

    // After a fixed time (animation duration), show the main content
    setTimeout(async () => {
        const schools = await schoolsPromise;
        if (schools) {
            renderSchoolList(schools);
            showPage('school-selection-screen');
        } else {
            showModal('앱을 시작하는 데 필요한 데이터를 불러오지 못했습니다.');
        }
    }, 2000); // 2-second logo animation

    setupGradeButtons();
    setupEventListeners();
});
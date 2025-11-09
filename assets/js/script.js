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

    // Student Menu Navigation
    document.getElementById('view-announcements-btn').addEventListener('click', showAnnouncements);
    document.getElementById('back-to-student-main-from-announcements').addEventListener('click', () => showPage('student-main-screen'));
    document.getElementById('view-daily-homework-btn').addEventListener('click', showDailyHomework);
    document.getElementById('back-to-student-main-from-daily-homework').addEventListener('click', () => showPage('student-main-screen'));
    document.getElementById('view-personal-homework-btn').addEventListener('click', showPersonalHomework);
    document.getElementById('back-to-student-main-from-personal-homework').addEventListener('click', () => showPage('student-main-screen'));

    // Teacher Menu Navigation
    document.getElementById('upload-announcement-btn').addEventListener('click', () => showPage('announcement-upload-screen'));
    document.getElementById('back-to-teacher-main-from-announcement-upload').addEventListener('click', () => showPage('teacher-main-screen'));
    
    document.getElementById('upload-daily-homework-btn').addEventListener('click', () => {
        showPage('daily-homework-upload-screen');
        addHomeworkTask('daily-homework-tasks-container'); // Add one task field by default
    });
    document.getElementById('back-to-teacher-main-from-daily-homework-upload').addEventListener('click', () => showPage('teacher-main-screen'));

    document.getElementById('upload-personal-homework-btn').addEventListener('click', () => {
        showPage('personal-homework-upload-screen');
        addHomeworkTask('personal-homework-tasks-container'); // Add one task field by default
    });
    document.getElementById('back-to-teacher-main-from-personal-homework-upload').addEventListener('click', () => showPage('teacher-main-screen'));

    // Dynamic Task Input Fields
    document.getElementById('add-daily-homework-task-btn').addEventListener('click', () => addHomeworkTask('daily-homework-tasks-container'));
    document.getElementById('add-personal-homework-task-btn').addEventListener('click', () => addHomeworkTask('personal-homework-tasks-container'));

    // Universal Back Buttons
    document.getElementById('back-to-school-selection').addEventListener('click', () => showPage('school-selection-screen'));
    document.getElementById('back-to-class-input').addEventListener('click', () => showPage('class-input-screen'));
    document.getElementById('back-to-role-selection-student').addEventListener('click', () => showPage('role-selection-screen'));
    document.getElementById('back-to-role-selection-teacher').addEventListener('click', () => showPage('role-selection-screen'));
    document.getElementById('back-to-role-selection-from-student-main').addEventListener('click', () => showPage('role-selection-screen'));
    document.getElementById('back-to-role-selection-from-teacher-main').addEventListener('click', () => showPage('role-selection-screen'));


    // Teacher Form Submissions
    document.getElementById('announcement-upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('announcement-title').value;
        const content = document.getElementById('announcement-content').value;
        
        const result = await apiCall('/api/upload/announcement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...appState, title, content })
        });

        if (result?.success) {
            showModal('공지사항이 성공적으로 등록되었습니다.');
            e.target.reset();
            showPage('teacher-main-screen');
        }
    });

    document.getElementById('daily-homework-upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('daily-homework-title').value;
        const dueDate = document.getElementById('daily-homework-due-date').value;
        const tasks = Array.from(document.querySelectorAll('#daily-homework-tasks-container .homework-task-input'))
                           .map(input => input.value)
                           .filter(value => value.trim() !== '');

        if (tasks.length === 0) {
            showModal('숙제 내용을 하나 이상 입력해주세요.');
            return;
        }

        const result = await apiCall('/api/upload/daily_homework', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...appState, title, dueDate, tasks })
        });

        if (result?.success) {
            showModal('오늘의 숙제가 성공적으로 등록되었습니다.');
            e.target.reset();
            document.getElementById('daily-homework-tasks-container').innerHTML = '';
            showPage('teacher-main-screen');
        }
    });

    document.getElementById('personal-homework-upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const attendanceNum = document.getElementById('personal-homework-attendance-number').value;
        const title = document.getElementById('personal-homework-title').value;
        const dueDate = document.getElementById('personal-homework-due-date').value;
        const tasks = Array.from(document.querySelectorAll('#personal-homework-tasks-container .homework-task-input'))
                           .map(input => input.value)
                           .filter(value => value.trim() !== '');

        if (tasks.length === 0) {
            showModal('숙제 내용을 하나 이상 입력해주세요.');
            return;
        }

        const result = await apiCall('/api/upload/personal_homework', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...appState, title, dueDate, tasks, attendanceNum })
        });

        if (result?.success) {
            showModal('개인 숙제가 성공적으로 등록되었습니다.');
            e.target.reset();
            document.getElementById('personal-homework-tasks-container').innerHTML = '';
            showPage('teacher-main-screen');
        }
    });
}

// --- Feature Implementations ---

async function showAnnouncements() {
    const announcements = await apiCall('/api/announcements');
    if (!announcements) return;

    const announcementsList = document.getElementById('announcements-list');
    announcementsList.innerHTML = ''; // Clear previous content

    const filteredAnnouncements = announcements.filter(ann =>
        ann.schoolId == appState.schoolId &&
        ann.grade == appState.grade &&
        ann.class == appState.classNum
    );

    if (filteredAnnouncements.length === 0) {
        announcementsList.innerHTML = '<p class="empty-message">등록된 공지사항이 없습니다.</p>';
    } else {
        filteredAnnouncements
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)) // Show newest first
            .forEach(ann => {
                const annEl = document.createElement('div');
                annEl.className = 'announcement-card';
                annEl.innerHTML = `
                    <div class="announcement-header">
                        <h3 class="announcement-title">${ann.title}</h3>
                        <span class="announcement-date">${ann.uploadDate}</span>
                    </div>
                    <p class="announcement-content">${ann.content.replace(/\n/g, '<br>')}</p>
                `;
                announcementsList.appendChild(annEl);
            });
    }

    showPage('announcements-screen');
}

async function showDailyHomework() {
    const homeworkList = document.getElementById('daily-homework-list');
    homeworkList.innerHTML = '<p>숙제를 불러오는 중...</p>';
    showPage('daily-homework-screen');

    const homeworks = await apiCall(`/api/daily_homework?school_id=${appState.schoolId}&grade=${appState.grade}&class=${appState.classNum}`);
    if (!homeworks) {
        homeworkList.innerHTML = '<p class="empty-message">숙제를 불러오는 데 실패했습니다.</p>';
        return;
    }

    homeworkList.innerHTML = ''; // Clear loading message

    if (homeworks.length === 0) {
        homeworkList.innerHTML = '<p class="empty-message">등록된 숙제가 없습니다.</p>';
    } else {
        homeworks
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)) // Show newest first
            .forEach(hw => {
                const hwEl = document.createElement('div');
                hwEl.className = 'homework-card'; // Similar styling to announcements
                
                const tasksHtml = hw.tasks.map(task => 
                    `<li class="homework-task-item">${task.content}</li>`
                ).join('');

                hwEl.innerHTML = `
                    <div class="homework-header">
                        <h3 class="homework-title">${hw.title}</h3>
                        <span class="homework-date">마감: ${hw.dueDate}</span>
                    </div>
                    <ul class="homework-task-list">${tasksHtml}</ul>
                `;
                homeworkList.appendChild(hwEl);
            });
    }
}

async function showPersonalHomework() {
    const personalHomeworkList = document.getElementById('personal-homework-list');
    personalHomeworkList.innerHTML = '<p>개인 숙제를 불러오는 중...</p>';
    showPage('personal-homework-screen');

    const homeworks = await apiCall(`/api/personal_homework?school_id=${appState.schoolId}&grade=${appState.grade}&class=${appState.classNum}&attendance_num=${appState.attendanceNum}`);
    if (!homeworks) {
        personalHomeworkList.innerHTML = '<p class="empty-message">개인 숙제를 불러오는 데 실패했습니다.</p>';
        return;
    }

    personalHomeworkList.innerHTML = ''; // Clear loading message

    if (homeworks.length === 0) {
        personalHomeworkList.innerHTML = '<p class="empty-message">등록된 개인 숙제가 없습니다.</p>';
    } else {
        homeworks
            .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)) // Show newest first
            .forEach(hw => {
                const hwEl = document.createElement('div');
                hwEl.className = 'homework-card'; // Re-use homework-card styling
                
                const tasksHtml = hw.tasks.map(task => 
                    `<li class="homework-task-item">${task.content}</li>`
                ).join('');

                hwEl.innerHTML = `
                    <div class="homework-header">
                        <h3 class="homework-title">${hw.title}</h3>
                        <span class="homework-date">마감: ${hw.dueDate}</span>
                    </div>
                    <ul class="homework-task-list">${tasksHtml}</ul>
                `;
                personalHomeworkList.appendChild(hwEl);
            });
    }
}

function addHomeworkTask(containerId) {
    const container = document.getElementById(containerId);
    const taskInput = document.createElement('input');
    taskInput.type = 'text';
    taskInput.className = 'clno-input homework-task-input';
    taskInput.placeholder = '숙제 내용을 입력하세요';
    taskInput.required = true;
    container.appendChild(taskInput);
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
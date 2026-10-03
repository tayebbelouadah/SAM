// State Management
let absences = JSON.parse(localStorage.getItem('absencesData')) || [];

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const viewSections = document.querySelectorAll('.view-section');
const absenceForm = document.getElementById('absence-form');
const serialInput = document.getElementById('serial-number');
const dateInput = document.getElementById('record-date');
const toast = document.getElementById('toast');

// Tables and Counters
const totalAbsencesEl = document.getElementById('total-absences');
const monthlyAbsencesEl = document.getElementById('monthly-absences');
const recentTbody = document.getElementById('recent-tbody');
const recordsTbody = document.getElementById('records-tbody');
const searchInput = document.getElementById('search-input');

// Initialize App
function initApp() {
    setupNavigation();
    setupForm();
    updateDashboard();
    renderRecordsTable();
}

// Navigation Logic
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            navBtns.forEach(b => b.classList.remove('active'));
            viewSections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Refresh tables if navigating to dashboard or records
            if(targetId === 'dashboard' || targetId === 'records-panel') {
                updateDashboard();
                renderRecordsTable();
            }
        });
    });
}

// Form Setup & Logic
function setupForm() {
    generateSerialNumber();
    setTodayDate();

    absenceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Collect Data
        const record = {
            id: generateUUID(),
            serialNumber: serialInput.value,
            date: new Date().toISOString(),
            lastName: document.getElementById('last-name').value,
            firstName: document.getElementById('first-name').value,
            regNumber: document.getElementById('reg-number').value,
            bacYear: document.getElementById('bac-year').value,
            level: document.getElementById('level').value,
            academicYear: document.getElementById('academic-year').value,
            duration: document.getElementById('absence-duration').value,
            issuer: document.getElementById('certificate-issuer').value
        };

        // Save
        absences.push(record);
        saveData();
        
        // Reset and show success
        absenceForm.reset();
        generateSerialNumber();
        setTodayDate();
        showToast('تم حفظ بيانات الغياب بنجاح!');
        updateDashboard();
        renderRecordsTable();
    });

    absenceForm.addEventListener('reset', () => {
        setTimeout(() => {
            generateSerialNumber();
            setTodayDate();
        }, 10);
    });
}

// Utilities
function generateSerialNumber() {
    const prefix = "ABS";
    const year = new Date().getFullYear().toString().slice(-2);
    const count = (absences.length + 1).toString().padStart(4, '0');
    serialInput.value = `${prefix}-${year}-${count}`;
}

function setTodayDate() {
    const today = new Date();
    // Formatting date to look nice in Arabic
    const formattedDate = `${today.getFullYear()}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getDate().toString().padStart(2,'0')}`;
    dateInput.value = formattedDate;
}

function generateUUID() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function saveData() {
    localStorage.setItem('absencesData', JSON.stringify(absences));
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Dashboard Update
function updateDashboard() {
    totalAbsencesEl.textContent = absences.length;
    
    // Calculate monthly absences
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCount = absences.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    
    monthlyAbsencesEl.textContent = monthlyCount;

    // Render Recent Records (last 5)
    recentTbody.innerHTML = '';
    const recent = [...absences].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    if (recent.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا توجد سجلات حديثة</td></tr>';
        return;
    }

    recent.forEach(record => {
        const tr = document.createElement('tr');
        const dateStr = new Date(record.date).toLocaleDateString('ar-DZ');
        tr.innerHTML = `
            <td><strong>${record.serialNumber}</strong></td>
            <td>${record.firstName} ${record.lastName}</td>
            <td>${record.level}</td>
            <td>${dateStr}</td>
        `;
        recentTbody.appendChild(tr);
    });
}

// Records Table Render
function renderRecordsTable(filterText = '') {
    recordsTbody.innerHTML = '';
    
    const filtered = absences.filter(r => {
        const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
        const search = filterText.toLowerCase();
        return fullName.includes(search) || r.regNumber.includes(search) || r.serialNumber.toLowerCase().includes(search);
    });

    // Sort by newest first
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        recordsTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد سجلات مطابقة</td></tr>';
        return;
    }

    filtered.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${record.serialNumber}</strong></td>
            <td>${record.firstName} ${record.lastName}</td>
            <td>${record.regNumber}</td>
            <td>${record.level}</td>
            <td>${record.duration} أيام</td>
            <td>${record.issuer}</td>
            <td>
                <button class="btn-delete" onclick="deleteRecord('${record.id}')" title="حذف السجل">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        recordsTbody.appendChild(tr);
    });
}

// Delete Record
window.deleteRecord = function(id) {
    if(confirm('هل أنت متأكد من رغبتك في حذف هذا السجل؟')) {
        absences = absences.filter(r => r.id !== id);
        saveData();
        updateDashboard();
        renderRecordsTable(searchInput.value);
        showToast('تم حذف السجل بنجاح');
    }
};

// Search Event
searchInput.addEventListener('input', (e) => {
    renderRecordsTable(e.target.value);
});

// Database (Export/Import) Logic
const btnExportExcel = document.getElementById('btn-export-excel');
const btnExportBackup = document.getElementById('btn-export-backup');
const importBackupInput = document.getElementById('import-backup');

if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => {
        if (absences.length === 0) {
            alert('لا توجد بيانات لتصديرها.');
            return;
        }
        
        const headers = ['الرقم التسلسلي', 'اللقب', 'الاسم', 'رقم التسجيل', 'عام البكالوريا', 'المستوى', 'السنة الدراسية', 'مدة الغياب', 'جهة الإصدار', 'تاريخ التسجيل'];
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        absences.forEach(record => {
            const row = [
                record.serialNumber,
                record.lastName,
                record.firstName,
                record.regNumber,
                record.bacYear,
                record.level,
                record.academicYear,
                record.duration,
                record.issuer,
                new Date(record.date).toLocaleDateString('ar-DZ')
            ];
            const escapedRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`);
            csvRows.push(escapedRow.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `غيابات_الطلبة_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    });
}

if (btnExportBackup) {
    btnExportBackup.addEventListener('click', () => {
        if (absences.length === 0) {
            alert('لا توجد بيانات لأخذ نسخة احتياطية.');
            return;
        }
        const jsonContent = JSON.stringify(absences, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_absences_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    });
}

if (importBackupInput) {
    importBackupInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    if (confirm('هل ترغب في دمج البيانات المستوردة مع البيانات الحالية؟\n\n- اختر "موافق" (OK) للدمج.\n- اختر "إلغاء" (Cancel) لمسح البيانات الحالية واستبدالها بالكامل.')) {
                        const existingIds = new Set(absences.map(a => a.id));
                        const newRecords = importedData.filter(a => !existingIds.has(a.id));
                        absences = [...absences, ...newRecords];
                    } else {
                        absences = importedData;
                    }
                    saveData();
                    updateDashboard();
                    renderRecordsTable(searchInput.value);
                    showToast('تم استيراد قاعدة البيانات بنجاح!');
                } else {
                    alert('ملف النسخة الاحتياطية غير صالح.');
                }
            } catch (error) {
                alert('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف JSON صحيح.');
            }
            importBackupInput.value = '';
        };
        reader.readAsText(file);
    });
}

// Login Logic
const loginForm = document.getElementById('login-form');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginError = document.getElementById('login-error');

function checkAuth() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        initApp();
    } else {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;
        
        if (usernameInput === 'admin' && passwordInput === '1234') {
            sessionStorage.setItem('isLoggedIn', 'true');
            loginContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            initApp();
        } else {
            loginError.style.display = 'block';
        }
    });
}

// Run Auth Check
document.addEventListener('DOMContentLoaded', checkAuth);

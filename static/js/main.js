/**
 * Smart Attendance & Productivity Tracker — Main JavaScript
 * Handles all client-side logic: API calls, UI updates, modals, export CSV.
 *
 * Author : Rizki (M.Rizki Aulia Wibowo)
 * Course : Komputasi Awan - Telkom University
 */

'use strict';

/* ── Utility: Show / Hide Loading Spinner ─────────────────────── */
function showLoading()  { document.getElementById('loadingOverlay')?.classList.remove('d-none'); }
function hideLoading()  { document.getElementById('loadingOverlay')?.classList.add('d-none'); }

/* ── Utility: Set alert message inside modal forms ────────────── */
function showFormMsg(elementId, message, type = 'danger') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `alert alert-${type} py-2 small`;
    el.textContent = message;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 4000);
}

/* ── Tab Switching ────────────────────────────────────────────── */
function switchTab(tab) {
    // Hide all panels
    document.getElementById('panel-attendance').classList.add('d-none');
    document.getElementById('panel-users').classList.add('d-none');

    // Remove active from all tab links
    document.getElementById('tab-attendance').classList.remove('active');
    document.getElementById('tab-users').classList.remove('active');

    // Show target panel
    document.getElementById(`panel-${tab}`).classList.remove('d-none');
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Load data for the tab
    if (tab === 'users') loadUsers();
    if (tab === 'attendance') loadAttendance();

    return false; // prevent href navigation
}

/* ══════════════════════════════════════════════════════════════
   STATISTICS
   ══════════════════════════════════════════════════════════════ */
async function loadStats() {
    try {
        const res  = await fetch('/api/statistics');
        const json = await res.json();

        if (!json.success) return;

        const d = json.data;
        const total = d.total_records;

        // Populate stat cards
        animateNumber('statTotalUsers',     d.total_users);
        animateNumber('statTotalRecords',   total);
        document.getElementById('statAttendanceRate').textContent = d.attendance_rate_percentage + '%';
        animateNumber('statHadirCount', d.status_breakdown.hadir);

        // Progress bar
        const pct = (n) => total > 0 ? (n / total * 100).toFixed(1) : 0;
        document.getElementById('barHadir').style.width  = pct(d.status_breakdown.hadir)  + '%';
        document.getElementById('barIzin').style.width   = pct(d.status_breakdown.izin)   + '%';
        document.getElementById('barSakit').style.width  = pct(d.status_breakdown.sakit)  + '%';
        document.getElementById('barAlpa').style.width   = pct(d.status_breakdown.alpa)   + '%';

        // Legend
        document.getElementById('legHadir').textContent = d.status_breakdown.hadir;
        document.getElementById('legIzin').textContent  = d.status_breakdown.izin;
        document.getElementById('legSakit').textContent = d.status_breakdown.sakit;
        document.getElementById('legAlpa').textContent  = d.status_breakdown.alpa;
        document.getElementById('totalRecordsBadge').textContent = `Total: ${total} catatan`;

    } catch (err) {
        console.error('Failed to load statistics:', err);
    }
}

/** Animate count-up for a numeric stat card */
function animateNumber(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.floor(targetValue / 30));
    const timer = setInterval(() => {
        current = Math.min(current + step, targetValue);
        el.textContent = current;
        if (current >= targetValue) clearInterval(timer);
    }, 30);
}

/* ══════════════════════════════════════════════════════════════
   ATTENDANCE
   ══════════════════════════════════════════════════════════════ */
async function loadAttendance() {
    const tbody  = document.getElementById('attendanceTableBody');
    const emptyEl = document.getElementById('attendanceEmpty');

    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>Memuat data...</td></tr>`;

    const date   = document.getElementById('filterDate')?.value   || '';
    const userId = document.getElementById('filterUserId')?.value || '';

    let url = '/api/attendance?';
    if (date)   url += `date=${date}&`;
    if (userId) url += `user_id=${userId}&`;

    try {
        const res  = await fetch(url);
        const json = await res.json();

        if (!json.success || json.data.length === 0) {
            tbody.innerHTML = '';
            emptyEl?.classList.remove('d-none');
            return;
        }

        emptyEl?.classList.add('d-none');
        tbody.innerHTML = json.data.map((r, i) => `
            <tr>
                <td><span class="text-muted">${i + 1}</span></td>
                <td><strong>${escapeHtml(r.user_name)}</strong></td>
                <td>${formatDate(r.date)}</td>
                <td>${r.time_in ? r.time_in.substring(0, 5) : '—'}</td>
                <td><span class="badge-status badge-${r.status.toLowerCase()}">${r.status}</span></td>
                <td class="text-muted">${r.activity_summary ? escapeHtml(r.activity_summary) : '<em>—</em>'}</td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">
            <i class="bi bi-wifi-off me-1"></i>Gagal memuat data. Coba refresh halaman.</td></tr>`;
        console.error('Attendance load error:', err);
    }
}

async function submitAttendance() {
    const userId   = document.getElementById('att_user_id').value;
    const status   = document.getElementById('att_status').value;
    const activity = document.getElementById('att_activity').value;
    const btn      = document.getElementById('btnSubmitAtt');

    if (!userId || !status) {
        showFormMsg('formAttMsg', 'Pengguna dan status wajib diisi!', 'danger');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';

    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: parseInt(userId), status, activity_summary: activity })
        });
        const json = await res.json();

        if (json.success) {
            showFormMsg('formAttMsg', 'Kehadiran berhasil dicatat! ✅', 'success');
            document.getElementById('formAttendance').reset();
            // Refresh data
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('addAttendanceModal'))?.hide();
                loadAttendance();
                loadStats();
            }, 1200);
        } else {
            showFormMsg('formAttMsg', json.message || 'Gagal menyimpan.', 'danger');
        }
    } catch (err) {
        showFormMsg('formAttMsg', 'Terjadi kesalahan jaringan.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save me-1"></i>Simpan';
    }
}

/* ══════════════════════════════════════════════════════════════
   USERS
   ══════════════════════════════════════════════════════════════ */
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>Memuat data...</td></tr>`;

    const role = document.getElementById('filterRole')?.value || '';
    const url  = role ? `/api/users?role=${role}` : '/api/users';

    try {
        const res  = await fetch(url);
        const json = await res.json();

        if (!json.success || json.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">
                <i class="bi bi-person-x me-1"></i>Belum ada pengguna terdaftar.</td></tr>`;
            return;
        }

        tbody.innerHTML = json.data.map(u => `
            <tr>
                <td><code>#${u.id}</code></td>
                <td><strong>${escapeHtml(u.name)}</strong></td>
                <td><span class="text-muted">${escapeHtml(u.email)}</span></td>
                <td><span class="badge-status badge-${u.role}">${u.role}</span></td>
                <td>${formatDate(u.created_at)}</td>
            </tr>
        `).join('');

        // Also populate the attendance modal dropdown
        populateUserDropdown(json.data);

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">
            <i class="bi bi-wifi-off me-1"></i>Gagal memuat data.</td></tr>`;
    }
}

async function submitUser() {
    const name  = document.getElementById('usr_name').value.trim();
    const email = document.getElementById('usr_email').value.trim();
    const role  = document.getElementById('usr_role').value;
    const btn   = document.getElementById('btnSubmitUser');

    if (!name || !email) {
        showFormMsg('formUserMsg', 'Nama dan email wajib diisi!', 'danger');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Mendaftarkan...';

    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, role })
        });
        const json = await res.json();

        if (json.success) {
            showFormMsg('formUserMsg', `Pengguna "${name}" berhasil didaftarkan! ✅`, 'success');
            document.getElementById('formUser').reset();
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('addUserModal'))?.hide();
                loadUsers();
                loadStats();
            }, 1200);
        } else {
            showFormMsg('formUserMsg', json.message || 'Gagal mendaftarkan pengguna.', 'danger');
        }
    } catch (err) {
        showFormMsg('formUserMsg', 'Terjadi kesalahan jaringan.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-person-check me-1"></i>Daftarkan';
    }
}

/** Populate user dropdown in attendance modal */
async function populateUserDropdown(users = null) {
    const select = document.getElementById('att_user_id');
    if (!select) return;

    if (!users) {
        const res  = await fetch('/api/users');
        const json = await res.json();
        users = json.success ? json.data : [];
    }

    select.innerHTML = '<option value="">-- Pilih Pengguna --</option>' +
        users.map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${u.role})</option>`).join('');
}

/* ══════════════════════════════════════════════════════════════
   EXPORT CSV
   ══════════════════════════════════════════════════════════════ */
async function exportCSV() {
    showLoading();
    try {
        const res  = await fetch('/api/attendance');
        const json = await res.json();

        if (!json.success || !json.data.length) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }

        const headers = ['ID', 'Nama', 'Tanggal', 'Waktu Masuk', 'Status', 'Ringkasan Aktivitas'];
        const rows = json.data.map(r => [
            r.id,
            `"${r.user_name}"`,
            r.date,
            r.time_in ? r.time_in.substring(0, 5) : '',
            r.status,
            `"${(r.activity_summary || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob  = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url   = URL.createObjectURL(blob);
        const link  = document.createElement('a');
        link.href   = url;
        link.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error('Export error:', err);
        alert('Gagal mengekspor data.');
    } finally {
        hideLoading();
    }
}

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
function clearFilters() {
    const filterDate   = document.getElementById('filterDate');
    const filterUserId = document.getElementById('filterUserId');
    if (filterDate)   filterDate.value   = '';
    if (filterUserId) filterUserId.value = '';
    loadAttendance();
}

function refreshData() {
    loadStats();
    loadAttendance();
    loadUsers();
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateString; }
}

/** Sanitize to prevent XSS */
function escapeHtml(text) {
    const el = document.createElement('div');
    el.appendChild(document.createTextNode(String(text || '')));
    return el.innerHTML;
}

/* ── Pre-populate user dropdown when Add Attendance modal opens ─ */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addAttendanceModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', () => populateUserDropdown());
    }
});

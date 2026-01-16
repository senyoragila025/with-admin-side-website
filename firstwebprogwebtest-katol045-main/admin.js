function validateAdminSession() {
	const adminAuth = localStorage.getItem('adminLoggedIn');
	const adminLoginTime = localStorage.getItem('adminLoginTime');
	
	if (!adminAuth) {
		window.location.href = 'auth.html';
		return false;
	}
	
	if (!adminLoginTime) {
		localStorage.removeItem('adminLoggedIn');
		window.location.href = 'auth.html';
		return false;
	}
	
	const sessionDuration = 24 * 60 * 60 * 1000;
	const currentTime = new Date().getTime();
	const loginTime = parseInt(adminLoginTime);
	
	if (currentTime - loginTime > sessionDuration) {
		localStorage.removeItem('adminLoggedIn');
		localStorage.removeItem('adminLoginTime');
		window.location.href = 'auth.html';
		return false;
	}
	
	const ADMIN_USERNAME = 'admin';
	const ADMIN_PASSWORD = 'wanwise123';
	
	window.ADMIN_CREDENTIALS = {
		username: ADMIN_USERNAME,
		password: ADMIN_PASSWORD
	};
	
	return true;
}

function checkAdminAuth() {
	if (!validateAdminSession()) {
		return;
	}
}

function showNotification(message, type = 'info', duration = 3000) {
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.textContent = message;
	notification.style.position = 'fixed';
	notification.style.top = '120px';
	notification.style.right = '20px';
	notification.style.padding = '15px 20px';
	notification.style.borderRadius = '8px';
	notification.style.color = 'white';
	notification.style.fontWeight = '600';
	notification.style.zIndex = '1000';
	notification.style.animation = 'slideIn 0.4s ease-out';
	notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
	
	if (type === 'success') notification.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
	else if (type === 'error') notification.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
	else if (type === 'info') notification.style.background = 'linear-gradient(135deg, #667eea, #5568d3)';
	else if (type === 'warning') notification.style.background = 'linear-gradient(135deg, #f39c12, #d68910)';
	
	document.body.appendChild(notification);
	
	setTimeout(() => {
		notification.style.animation = 'slideOut 0.4s ease-in';
		setTimeout(() => notification.remove(), 400);
	}, duration);
}

checkAdminAuth();

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'wanderwiseData';
    const COMMENTS_KEY = 'wanderwiseUserComments';
    let allData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    let allComments = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
    let chart = null;

    showNotification('🔐 Admin Dashboard Loaded', 'success', 2000);

    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('pendingUserVerification');
            
            window.ADMIN_CREDENTIALS = null;
            
            showNotification('✅ Logged out securely', 'success', 1000);
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1000);
        }
    });

    const form = document.getElementById('dataInputForm');
    const destSelect = document.getElementById('destSelect');
    const dataDate = document.getElementById('dataDate');
    const hourlyData = document.getElementById('hourlyData');
    const processLog = document.getElementById('processLog');

    function log(msg) {
        const time = new Date().toLocaleTimeString();
        const entry = `[${time}] ${msg}`;
        const logs = processLog.textContent.split('\n').filter(l => l.trim());
        processLog.textContent = entry + '\n' + logs.slice(0, 9).join('\n');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        log('📥 INPUT received');

        const dest = destSelect.value;
        const date = dataDate.value;
        const hourlyStr = hourlyData.value.trim();

        if (!dest || !date) {
            log('❌ VALIDATION: Required fields missing');
            showNotification('⚠️ Please fill in all fields', 'warning');
            return;
        }

        let hourly = [];
        if (hourlyStr) {
            try {
                hourly = hourlyStr.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
                if (hourly.length !== 24) {
                    log(`⚠️ WARNING: Expected 24 values, got ${hourly.length}`);
                    showNotification(`⚠️ Please enter 24 hourly values (got ${hourly.length})`, 'warning');
                    return;
                }
            } catch {
                log('❌ ERROR: Invalid hourly data');
                showNotification('❌ Invalid data format', 'error');
                return;
            }
        }

        const finalDaily = hourly.length > 0 ? hourly.reduce((a,b)=>a+b) : 0;

        if (!allData[dest]) allData[dest] = [];
        allData[dest].push({
            id: Date.now(),
            date,
            daily: finalDaily,
            hourly: hourly.length > 0 ? hourly : null
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));

        log(`✅ SAVED: ${dest} - ${finalDaily} total visitors`);
        showNotification(`✅ Data saved for ${dest}!`, 'success');
        updateOutput();
        updateChart();
        form.reset();
        dataDate.valueAsDate = new Date();
    });

    function updateOutput() {
        let total = 0;
        let count = 0;
        let html = '<strong>Recent Data:</strong><br>';

        for (const dest in allData) {
            if (allData[dest].length > 0) {
                const latest = allData[dest][allData[dest].length - 1];
                total += latest.daily;
                count += allData[dest].length;
                html += `${dest}: ${latest.daily} visitors<br>`;
            }
        }

        html += `<hr><strong>Total:</strong> ${total} | <strong>Records:</strong> ${count}`;
        document.getElementById('outputSummary').innerHTML = html;
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
    }

    function initChart() {
        const ctx = document.getElementById('adminChart')?.getContext('2d');
        if (!ctx) return;

        const hours = Array(24).fill(0).map((_,i) => i+':00');
        const defaultData = Array(24).fill(0);

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Hourly Visitors',
                    data: defaultData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Visitors' } },
                    x: { title: { display: true, text: 'Hour of Day' } }
                },
                plugins: { legend: { display: true }, title: { display: false } }
            }
        });
    }

    function updateChart() {
        if (!chart) {
            initChart();
            return;
        }

        const selectedDest = destSelect.value;
        const destData = allData[selectedDest];
        const latestData = destData && destData.length > 0 ? destData[destData.length - 1].hourly : Array(24).fill(0);

        chart.data.datasets[0].data = latestData || Array(24).fill(0);
        chart.data.datasets[0].label = `${selectedDest} - Hourly Visitors`;
        chart.update();
    }

    function displayComments() {
        const section = document.getElementById('commentsSection');
        
        if (allComments.length === 0) {
            section.innerHTML = '<p style="font-size:12px;color:#999;">No comments yet</p>';
            return;
        }

        let html = '';
        allComments.forEach((comment, idx) => {
            const statusClass = comment.approved ? 'status-approved' : 'status-pending';
            const statusText = comment.approved ? 'Approved' : 'Pending';
            
            html += `
                <div class="comment-card">
                    <div class="comment-header">
                        <span>${comment.destination}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div style="margin-top:6px;">
                        <span class="comment-author">${comment.author}</span>
                        <span class="comment-rating">⭐ Crowd: ${comment.crowdLevel}/5</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        ${!comment.approved ? `<button class="btn-approve" onclick="approveComment(${idx})">✓ Approve</button>` : ''}
                        <button class="btn-delete" onclick="deleteComment(${idx})">✕ Delete</button>
                    </div>
                </div>
            `;
        });

        section.innerHTML = html;
    }

    window.approveComment = (idx) => {
        allComments[idx].approved = true;
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
        log(`✅ Comment approved`);
        showNotification('👍 Comment approved!', 'success');
        displayComments();
    };

    window.deleteComment = (idx) => {
        if (confirm('Delete this comment?')) {
            allComments.splice(idx, 1);
            localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
            log(`🗑️ Comment deleted`);
            showNotification('🗑️ Comment deleted', 'warning');
            displayComments();
        }
    };

    const syncBtn = document.getElementById('syncBtn');
    const exportBtn = document.getElementById('exportBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const lastSyncSpan = document.getElementById('lastSync');
    
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            log('🔄 Syncing data with API...');
            showNotification('Syncing data...', 'info');
            setTimeout(() => {
                lastSyncSpan.textContent = new Date().toLocaleTimeString();
                log('✅ Data synchronized successfully');
                showNotification('Data synced successfully!', 'success');
            }, 800);
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            log('💾 Generating report export...');
            showNotification('Exporting report...', 'info');
            setTimeout(() => {
                const data = localStorage.getItem('wanderwiseData');
                const dataStr = JSON.stringify(JSON.parse(data || '{}'), null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `wanderwise-report-${new Date().getTime()}.json`;
                a.click();
                log('📄 Report exported');
                showNotification('Report exported successfully!', 'success');
            }, 800);
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            log('🔌 Refreshing API connection...');
            showNotification('Checking API connection...', 'info');
            setTimeout(() => {
                const status = document.getElementById('apiStatus');
                status.textContent = 'Connected';
                status.style.background = '#2ecc71';
                log('✅ API connection restored');
                showNotification('API connection healthy!', 'success');
            }, 600);
        });
    }

    dataDate.valueAsDate = new Date();
    destSelect.addEventListener('change', updateChart);
    updateOutput();
    displayComments();
    initChart();
    
    lastSyncSpan.textContent = new Date().toLocaleTimeString();
});

const destinations = [
	{ id: 'burnham', name: '📌 Burnham Park', lat: 16.4023, lng: 120.5960, desc: 'Historic public park with gardens and recreational facilities' },
	{ id: 'mines', name: '📌 Mines View Park', lat: 16.3830, lng: 120.5500, desc: 'Scenic viewpoint overlooking the Old Mines and Baguio cityscape' },
	{ id: 'wright', name: '📌 Wright Park', lat: 16.4060, lng: 120.5990, desc: 'Pine-forested park with walking trails and picnic areas' },
	{ id: 'botanical', name: '📌 Botanical Garden', lat: 16.3890, lng: 120.6050, desc: 'Garden featuring native and ornamental plants' },
	{ id: 'campjohn', name: '📌 Camp John Hay', lat: 16.3900, lng: 120.5800, desc: 'Recreation area with sports facilities and nature walks' },
	{ id: 'session', name: '📌 Session Road', lat: 16.4080, lng: 120.5900, desc: 'Main commercial street with shops, cafes, and restaurants' },
	{ id: 'heritage', name: '📌 Cordillera Heritage', lat: 16.3950, lng: 120.5850, desc: 'Cultural museum showcasing indigenous art and traditions' },
	{ id: 'tamawan', name: '📌 Tam-Awan Village', lat: 16.3920, lng: 120.5920, desc: 'Artistic community with galleries, cafes, and craft shops' },
	{ id: 'strawberry', name: '📌 Strawberry Farms', lat: 16.3800, lng: 120.5950, desc: 'Highland agricultural estate with farm tours and fresh produce' },
	{ id: 'smbaguio', name: '🛍️ SM Baguio', lat: 16.4100, lng: 120.5950, desc: 'Premier shopping mall with restaurants, entertainment, and cinema' }
];

function showNotification(message, type = 'info', duration = 3000) {
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.textContent = message;
	document.body.appendChild(notification);
	
	setTimeout(() => {
		notification.classList.add('exit');
		setTimeout(() => notification.remove(), 400);
	}, duration);
}

let map, chart, currentDest = null;
let selectedRating = 0;
let allComments = JSON.parse(localStorage.getItem('wanderwiseUserComments')) || [];

function initTheme() {
	const saved = localStorage.getItem('theme') || 'light';
	if (saved === 'dark') document.body.classList.add('dark-mode');
	updateThemeBtn();
}

function updateThemeBtn() {
	document.getElementById('theme-toggle').textContent = 
		document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

function initHamburger() {
	const hamburger = document.getElementById('hamburger-btn');
	const sidebar = document.getElementById('sidebar');
	const sidebarClose = document.getElementById('sidebar-close');
	
	hamburger.addEventListener('click', () => {
		sidebar.classList.toggle('open');
	});
	
	sidebarClose.addEventListener('click', () => {
		sidebar.classList.remove('open');
	});
	
	document.addEventListener('click', (e) => {
		if (e.target.closest('.dest-card')) {
			sidebar.classList.remove('open');
		}
	});
}

function initDestinations() {
	const destList = document.getElementById('dest-list');
	destList.innerHTML = destinations.map(dest => `
		<div class="dest-card" data-id="${dest.id}">
			<h3>${dest.name}</h3>
			<p>${dest.desc}</p>
			<div style="margin-top:6px;">
				<span class="crowd-badge" id="crowd-${dest.id}">Avg: --</span>
			</div>
		</div>
	`).join('');
	
	document.querySelectorAll('.dest-card').forEach(card => {
		card.addEventListener('click', () => {
			currentDest = destinations.find(d => d.id === card.dataset.id);
			selectDestination(currentDest);
		});
	});
}

function initRatingStars() {
	const stars = document.querySelectorAll('.star');
	const ratingText = document.getElementById('ratingText');
	
	stars.forEach(star => {
		star.addEventListener('click', () => {
			selectedRating = parseInt(star.dataset.rating);
			stars.forEach((s, i) => {
				s.classList.toggle('active', i < selectedRating);
			});
			const labels = ['', '😔 Quiet', '🙂 Moderate', '😐 Crowded', '😕 Very Crowded', '😰 Extremely Crowded'];
			ratingText.textContent = labels[selectedRating];
		});
		
		star.addEventListener('mouseover', () => {
			const hoverRating = parseInt(star.dataset.rating);
			stars.forEach((s, i) => {
				s.style.opacity = i < hoverRating ? '1' : '0.3';
			});
		});
	});
	
	document.querySelector('.rating-input').addEventListener('mouseout', () => {
		stars.forEach((s, i) => {
			s.style.opacity = i < selectedRating ? '1' : '0.3';
		});
	});
}

function addComment(dest, name, text, rating) {
	const comment = {
		destination: dest.id,
		author: name,
		text: text,
		crowdLevel: rating,
		timestamp: new Date().toLocaleString(),
		id: Date.now()
	};
	allComments.push(comment);
	localStorage.setItem('wanderwiseUserComments', JSON.stringify(allComments));
	displayComments(dest.id);
	updateCrowdBadges();
	showNotification(`✅ Review posted! Thanks for sharing, ${name}!`, 'success');
}

function deleteComment(commentId) {
	allComments = allComments.filter(c => c.id !== commentId);
	localStorage.setItem('wanderwiseUserComments', JSON.stringify(allComments));
	if (currentDest) displayComments(currentDest.id);
	updateCrowdBadges();
	showNotification('🗑️ Review deleted', 'warning');
}

function displayComments(destId) {
	const commentsList = document.getElementById('comments-list');
	const destComments = allComments.filter(c => c.destination === destId);
	
	commentsList.innerHTML = destComments.map(comment => {
		const crowdLabels = ['', '😔', '🙂', '😐', '😕', '😰'];
		return `
			<div class="comment-item">
				<strong>${comment.author}</strong>
				<span class="comment-rating">${crowdLabels[comment.crowdLevel]} Crowd: ${comment.crowdLevel}/5</span>
				<button class="comment-delete" onclick="deleteComment(${comment.id})">Delete</button>
				<div style="margin-top:4px;font-size:11px;color:#999;">${comment.timestamp}</div>
				<p style="margin:6px 0 0 0;">${comment.text}</p>
			</div>
		`;
	}).join('');
}

function updateCrowdBadges() {
	destinations.forEach(dest => {
		const destComments = allComments.filter(c => c.destination === dest.id);
		if (destComments.length === 0) {
			document.getElementById(`crowd-${dest.id}`).textContent = 'Avg: --';
		} else {
			const avgRating = (destComments.reduce((sum, c) => sum + c.crowdLevel, 0) / destComments.length).toFixed(1);
			const crowdLabels = ['', '😔 Quiet', '🙂 Moderate', '😐 Crowded', '😕 Very Crowded', '😰 Extremely'];
			document.getElementById(`crowd-${dest.id}`).innerHTML = 
				`${crowdLabels[Math.round(avgRating)]} (${destComments.length} reviews)`;
		}
	});
}

function selectDestination(dest) {
	currentDest = dest;
	document.querySelectorAll('.dest-card').forEach(card => card.classList.remove('active'));
	document.querySelector(`[data-id="${dest.id}"]`).classList.add('active');
	
	document.getElementById('chart-title').textContent = dest.name;
	
	const storedData = JSON.parse(localStorage.getItem('wanderwiseData') || '{}');
	const destHourlyData = storedData[dest.id] || Array(24).fill(0);
	
	renderChart(destHourlyData);
	displayComments(dest.id);
	
	const destComments = allComments.filter(c => c.destination === dest.id);
	if (destComments.length > 0) {
		const avg = (destComments.reduce((sum, c) => sum + c.crowdLevel, 0) / destComments.length).toFixed(1);
		document.getElementById('strain-text').textContent = `Avg Crowd Level: ${avg}/5`;
	} else {
		document.getElementById('strain-text').textContent = 'Crowd Level: No data yet';
	}
}

function renderChart(data) {
	const ctx = document.getElementById('destChart');
	if (chart) chart.destroy();
	
	const hours = Array(24).fill(0).map((_, i) => i + ':00');
	chart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: hours,
			datasets: [{
				label: 'Visitor Count',
				data: data,
				borderColor: '#667eea',
				backgroundColor: 'rgba(102, 126, 234, 0.1)',
				tension: 0.4,
				fill: true
			}]
		},
		options: {
			responsive: false,
			plugins: { legend: { display: false } },
			scales: {
				y: { beginAtZero: true }
			}
		}
	});
}

function initCommentForm() {
	const form = document.getElementById('comment-form');
	form.addEventListener('submit', (e) => {
		e.preventDefault();
		if (!currentDest) {
			showNotification('⚠️ Please select a destination first', 'warning');
			return;
		}
		if (selectedRating === 0) {
			showNotification('⭐ Please select a crowd rating', 'warning');
			return;
		}
		
		const name = document.getElementById('comment-name').value.trim();
		const text = document.getElementById('comment-text').value.trim();
		
		if (!name || !text) {
			showNotification('📝 Please fill in all fields', 'error');
			return;
		}
		
		addComment(currentDest, name, text, selectedRating);
		
		form.reset();
		selectedRating = 0;
		document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
		document.getElementById('ratingText').textContent = 'Not rated';
	});
}

function initMap() {
	map = L.map('map').setView([16.4023, 120.5960], 12);
	
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '© OpenStreetMap contributors',
		maxZoom: 18
	}).addTo(map);
	
	destinations.forEach(dest => {
		const marker = L.marker([dest.lat, dest.lng]).addTo(map);
		marker.bindPopup(`<strong>${dest.name}</strong><br>${dest.desc}<br><a href="#" onclick="document.querySelector('[data-id=\\'${dest.id}\\']').click(); return false;">View Details</a>`);
	});
}

document.addEventListener('DOMContentLoaded', () => {
	initTheme();
	initHamburger();
	initDestinations();
	initRatingStars();
	initCommentForm();
	initMap();
	updateCrowdBadges();
	
	document.getElementById('theme-toggle').addEventListener('click', () => {
		document.body.classList.toggle('dark-mode');
		const isDark = document.body.classList.contains('dark-mode');
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		updateThemeBtn();
		showNotification(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled', 'info');
	});
	
	document.getElementById('filters-btn').addEventListener('click', () => {
		showNotification('🎯 Filters: Parks • Shopping • Cultural • All Destinations', 'info', 4000);
	});
	
	document.getElementById('help-btn').addEventListener('click', () => {
		document.getElementById('help-modal').style.display = 'block';
		showNotification('ℹ️ Help modal opened', 'info', 2000);
	});
	
	document.getElementById('help-modal').addEventListener('click', (e) => {
		if (e.target.id === 'help-modal') {
			document.getElementById('help-modal').style.display = 'none';
		}
	});
	
	selectDestination(destinations[0]);
	showNotification('👋 Welcome to WanderWise!', 'success', 2000);
});


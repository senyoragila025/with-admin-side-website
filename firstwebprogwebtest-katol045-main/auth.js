const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'wanwise123';

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePasswordStrength(password) {
    if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain uppercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
    return { valid: true, message: 'Strong password' };
}

function initializeUsers() {
    if (!localStorage.getItem('wanderwiseUsers')) {
        const defaultUsers = [
            { 
                id: 1,
                name: 'Demo User', 
                email: 'demo@wanderwise.com', 
                passwordHash: hashPassword('demo123'),
                createdAt: new Date().toISOString(),
                status: 'active',
                isVerified: true
            }
        ];
        localStorage.setItem('wanderwiseUsers', JSON.stringify(defaultUsers));
    }
}

function isSessionValid(user) {
    if (!user) return false;
    if (!user.loginTime) return false;
    
    const sessionDuration = 24 * 60 * 60 * 1000;
    const currentTime = new Date().getTime();
    
    if (currentTime - user.loginTime > sessionDuration) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('adminLoggedIn');
        return false;
    }
    return true;
}

function fetchUserByEmail(email) {
    const users = JSON.parse(localStorage.getItem('wanderwiseUsers') || '[]');
    return users.find(u => u.email === email);
}

function createUserRecord(name, email, passwordHash) {
    return {
        id: Date.now(),
        name: name,
        email: email,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        status: 'active',
        isVerified: false,
        metadata: {
            loginAttempts: 0,
            lastAttempt: null
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initializeUsers();

    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    const indicator = document.getElementById('indicator');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            indicator.style.transform = `translateX(${index * 100}%)`;
            
            forms.forEach(f => f.classList.add('form-hidden'));
            document.getElementById(`${tab.dataset.form}-form`).classList.remove('form-hidden');
        });
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const emailOrUsername = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const msg = document.getElementById('login-message');

        if (emailOrUsername === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminLoginTime', new Date().getTime());
            
            msg.className = 'message success';
            msg.textContent = '✅ Admin login successful! Redirecting...';
            setTimeout(() => window.location.href = 'admin.html', 1000);
            return;
        }

        if (!isValidEmail(emailOrUsername) && emailOrUsername !== 'demo@wanderwise.com') {
            msg.className = 'message error';
            msg.textContent = '❌ Invalid email format';
            return;
        }

        const user = fetchUserByEmail(emailOrUsername);

        if (!user) {
            msg.className = 'message error';
            msg.textContent = '❌ User not found. Please create an account first.';
            return;
        }

        if (user.status !== 'active') {
            msg.className = 'message error';
            msg.textContent = '❌ Account is inactive. Contact support.';
            return;
        }

        const passwordHash = hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            msg.className = 'message error';
            msg.textContent = '❌ Invalid password. Please try again.';
            
            user.metadata = user.metadata || {};
            user.metadata.loginAttempts = (user.metadata.loginAttempts || 0) + 1;
            user.metadata.lastAttempt = new Date().toISOString();
            
            if (user.metadata.loginAttempts >= 5) {
                user.status = 'locked';
                const users = JSON.parse(localStorage.getItem('wanderwiseUsers'));
                const userIndex = users.findIndex(u => u.email === user.email);
                users[userIndex] = user;
                localStorage.setItem('wanderwiseUsers', JSON.stringify(users));
                
                msg.textContent = '❌ Account locked due to multiple failed attempts. Contact support.';
            }
            return;
        }

        user.metadata = user.metadata || {};
        user.metadata.loginAttempts = 0;
        user.metadata.lastAttempt = null;
        user.lastLogin = new Date().toISOString();
        
        const users = JSON.parse(localStorage.getItem('wanderwiseUsers'));
        const userIndex = users.findIndex(u => u.email === user.email);
        users[userIndex] = user;
        localStorage.setItem('wanderwiseUsers', JSON.stringify(users));

        const sessionData = {
            userId: user.id,
            name: user.name,
            email: user.email,
            loginTime: new Date().getTime(),
            isVerified: user.isVerified,
            status: user.status
        };
        
        localStorage.setItem('currentUser', JSON.stringify(sessionData));
        
        msg.className = 'message success';
        msg.textContent = `✅ Welcome back, ${user.name}!`;
        setTimeout(() => window.location.href = 'map.html', 1000);
    });

    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const pass = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        const msg = document.getElementById('signup-message');

        if (!name || !email || !pass || !confirm) {
            msg.className = 'message error';
            msg.textContent = '❌ All fields are required';
            return;
        }

        if (name.length < 2) {
            msg.className = 'message error';
            msg.textContent = '❌ Name must be at least 2 characters';
            return;
        }

        if (!isValidEmail(email)) {
            msg.className = 'message error';
            msg.textContent = '❌ Invalid email format';
            return;
        }

        const passwordCheck = validatePasswordStrength(pass);
        if (!passwordCheck.valid) {
            msg.className = 'message error';
            msg.textContent = `❌ ${passwordCheck.message}`;
            return;
        }

        if (pass !== confirm) {
            msg.className = 'message error';
            msg.textContent = '❌ Passwords do not match';
            return;
        }

        const users = JSON.parse(localStorage.getItem('wanderwiseUsers') || '[]');
        
        if (users.find(u => u.email === email)) {
            msg.className = 'message error';
            msg.textContent = '❌ This email is already registered';
            return;
        }

        const passwordHash = hashPassword(pass);
        const newUser = createUserRecord(name, email, passwordHash);
        users.push(newUser);
        
        localStorage.setItem('wanderwiseUsers', JSON.stringify(users));
        localStorage.setItem('pendingUserVerification', JSON.stringify({
            userId: newUser.id,
            email: newUser.email,
            createdAt: new Date().toISOString()
        }));

        msg.className = 'message success';
        msg.textContent = '✅ Account created! Logging in...';
        
        setTimeout(() => {
            const sessionData = {
                userId: newUser.id,
                name: newUser.name,
                email: newUser.email,
                loginTime: new Date().getTime(),
                isVerified: newUser.isVerified,
                status: newUser.status
            };
            
            localStorage.setItem('currentUser', JSON.stringify(sessionData));
            window.location.href = 'map.html';
        }, 1000);
    });
});

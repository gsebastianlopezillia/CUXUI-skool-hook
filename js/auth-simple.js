// Supabase Authentication
class SimpleAuth {
    constructor() {
        this.supabase = window.supabaseClient;
        this.init();
    }

    async init() {
        if (!this.supabase) {
            console.warn("Supabase not configured. Check supabase-config.js");
            this.showLoginModal();
            return;
        }
        this.supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                this.hideLoginShowAdmin();
            } else {
                this.showLoginModal();
            }
        });
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) {
            this.hideLoginShowAdmin();
        } else {
            this.showLoginModal();
        }
    }

    showLoginModal() {
        const adminEl = document.getElementById('adminContent');
        if (adminEl) adminEl.style.display = 'none';
        const existing = document.querySelector('.auth-modal');
        if (existing) return;
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2><span class="comunidad">comunidad</span> <span class="uxui">UXUI</span></h2>
                    <p>Panel de administración</p>
                </div>
                <form id="loginForm" class="auth-form">
                    <div class="form-group">
                        <label for="email">Correo</label>
                        <input type="email" id="email" placeholder="tu@correo.com" required autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="password">Contraseña</label>
                        <div class="password-wrap">
                            <input type="password" id="password" placeholder="••••••••" required autocomplete="current-password">
                            <button type="button" class="password-toggle" id="passwordToggle" title="Mostrar contraseña" aria-label="Mostrar contraseña">
                                <svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                <svg class="icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="auth-button primary">Entrar</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('passwordToggle');
        const iconEye = toggleBtn.querySelector('.icon-eye');
        const iconEyeOff = toggleBtn.querySelector('.icon-eye-off');

        toggleBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            iconEye.style.display = isPassword ? 'none' : 'block';
            iconEyeOff.style.display = isPassword ? 'block' : 'none';
            toggleBtn.setAttribute('title', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
            toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        });

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!this.supabase) {
                alert('Supabase no configurado. Revisá supabase-config.js');
                return;
            }
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const { error } = await this.supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                modal.remove();
            } catch (error) {
                alert('Error al entrar: ' + (error.message || error));
            }
        });
    }

    hideLoginShowAdmin() {
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();

        document.getElementById('adminContent').style.display = 'block';

        if (typeof window.initMediaAdmin === 'function') {
            window.initMediaAdmin();
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.supabase.auth.signOut();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authSimple = new SimpleAuth();
});

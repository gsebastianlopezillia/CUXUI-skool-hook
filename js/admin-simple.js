// Simple Media Admin - Supabase (Auth, Postgres, Storage)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB por archivo

class SimpleMediaAdmin {
    constructor() {
        this.supabase = window.supabaseClient;
        this.bucket = window.supabaseBucket || "media";
    }

    init() {
        if (this._inited) return;
        this._inited = true;
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.filesList = document.getElementById('filesList');

        this.setupEventListeners();
        this.loadExistingFiles();
    }

    setupEventListeners() {
        this.uploadArea.addEventListener('click', (e) => {
            if (e.target === this.fileInput) return;
            e.preventDefault();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            this.handleFiles(files);
        });
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(Array.from(e.dataTransfer.files));
        });
    }

    async handleFiles(files) {
        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                alert(`"${file.name}" supera el límite de 5 MB. Tamaño: ${this.formatFileSize(file.size)}`);
                continue;
            }
            await this.uploadFile(file);
        }
        this.fileInput.value = '';
    }

    async uploadFile(file) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return;
        if (!this.supabase || !this.bucket) {
            alert("Supabase no configurado. Revisá supabase-config.js (URL, anon key, bucket).");
            return;
        }
        try {
            const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const filePath = `users/${user.id}/${fileId}_${file.name}`;

            const { error: uploadError } = await this.supabase.storage
                .from(this.bucket)
                .upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = this.supabase.storage.from(this.bucket).getPublicUrl(filePath);
            const downloadURL = urlData.publicUrl;

            const row = {
                id: fileId,
                name: file.name,
                url: downloadURL,
                size: file.size,
                type: file.type,
                uploaded_at: new Date().toISOString(),
                uploaded_by: user.email,
                owner_id: user.id,
                storage_path: filePath
            };
            const { error: insertError } = await this.supabase.from('files').insert(row);
            if (insertError) throw insertError;

            this.addFileToList({
                id: fileId,
                name: file.name,
                url: downloadURL,
                size: this.formatFileSize(file.size),
                type: file.type,
                uploaded_at: row.uploaded_at,
                storage_path: filePath
            });

        } catch (error) {
            console.error('Upload error:', error);
            let msg = 'Error subiendo archivo: ' + (error.message || error);
            if (error?.code === 'PGRST205') {
                msg = 'La tabla "files" no existe. Ejecutá supabase/setup.sql en Supabase Dashboard → SQL Editor.';
            } else if (error?.message && error.message.toLowerCase().includes('bucket not found')) {
                msg = 'El bucket "' + this.bucket + '" no existe. Crealo en Supabase Dashboard → Storage → New bucket (nombre: ' + this.bucket + ', público).';
            }
            alert(msg);
        }
    }

    async loadExistingFiles() {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return;
        this.filesList.innerHTML = '';
        try {
            const { data: rows, error } = await this.supabase
                .from('files')
                .select('*')
                .eq('owner_id', user.id)
                .is('deleted_at', null)
                .order('uploaded_at', { ascending: false });
            if (error) throw error;
            (rows || []).forEach(row => this.addFileToList({
                id: row.id,
                name: row.name,
                url: row.url,
                size: this.formatFileSize(row.size),
                type: row.type,
                uploaded_at: row.uploaded_at,
                storage_path: row.storage_path
            }));
        } catch (error) {
            console.error('Error loading files:', error);
            if (error?.code === 'PGRST205') {
                alert('La tabla "files" no existe en Supabase. Ejecutá supabase/setup.sql en Dashboard → SQL Editor.');
            }
        }
    }

    addFileToList(fileData) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        const url = fileData.url || '';
        const name = this.escapeHtml(fileData.name);
        const date = new Date(fileData.uploaded_at).toLocaleDateString();
        const storagePath = fileData.storage_path || '';
        const fileId = fileData.id || '';
        fileItem.innerHTML = `
            <div class="file-info">
                <h4>${name}</h4>
                <p>${fileData.size} • ${date}</p>
                <p><strong>Link:</strong> <a href="" target="_blank" rel="noopener"></a></p>
            </div>
            <button type="button" class="copy-btn">Copiar link</button>
            <button type="button" class="delete-btn" title="Eliminar">Eliminar</button>
        `;
        const link = fileItem.querySelector('.file-info a');
        link.href = url;
        link.textContent = url;
        const copyBtn = fileItem.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(url).then(() => { copyBtn.textContent = 'Copiado'; });
        });
        const deleteBtn = fileItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.confirmDelete(fileId, storagePath, name, fileItem));
        this.filesList.appendChild(fileItem);
    }

    showConfirmModal(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal">
                <p class="confirm-modal-message">${this.escapeHtml(message)}</p>
                <div class="confirm-modal-actions">
                    <button type="button" class="confirm-modal-cancel">Cancelar</button>
                    <button type="button" class="confirm-modal-confirm">Eliminar</button>
                </div>
            </div>
        `;
        const cancelBtn = overlay.querySelector('.confirm-modal-cancel');
        const confirmBtn = overlay.querySelector('.confirm-modal-confirm');
        const remove = () => { overlay.remove(); };
        cancelBtn.addEventListener('click', () => { onCancel && onCancel(); remove(); });
        confirmBtn.addEventListener('click', () => { onConfirm && onConfirm(); remove(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { onCancel && onCancel(); remove(); } });
        document.body.appendChild(overlay);
    }

    confirmDelete(fileId, storagePath, fileName, fileItemEl) {
        this.showConfirmModal('¿Eliminar "' + fileName + '"? El archivo se borrará de Storage y dejará de estar en la lista.', () => {
            this.deleteFile(fileId, storagePath, fileItemEl);
        });
    }

    async deleteFile(fileId, storagePath, fileItemEl) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) {
                alert('Sesión expirada. Volvé a iniciar sesión.');
                return;
            }
            const { error: dbError } = await this.supabase.rpc('soft_delete_file', { file_id: fileId });
            if (dbError) throw dbError;
            fileItemEl.remove();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error al eliminar: ' + (error.message || error));
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

window.initMediaAdmin = function () {
    if (!window.mediaAdmin) {
        window.mediaAdmin = new SimpleMediaAdmin();
    }
    window.mediaAdmin.init();
};

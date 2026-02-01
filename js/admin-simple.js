// Simple Media Admin - Basic file upload and link generation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB por archivo

class SimpleMediaAdmin {
    constructor() {
        this.db = firebase.firestore();
        this.storage = firebase.storage();
    }

    init() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.filesList = document.getElementById('filesList');

        this.setupEventListeners();
        this.loadExistingFiles();
    }

    setupEventListeners() {
        // Click to select files
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files));
        });

        // Drag and drop
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
    }

    async uploadFile(file) {
        const user = firebase.auth().currentUser;
        if (!user) return;
        try {
            const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const filePath = `users/${user.uid}/${fileId}_${file.name}`;

            // Upload to Storage
            const storageRef = this.storage.ref(filePath);
            await storageRef.put(file);
            const downloadURL = await storageRef.getDownloadURL();

            // Save to Firestore
            await this.db.collection('files').doc(fileId).set({
                id: fileId,
                name: file.name,
                url: downloadURL,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                uploadedBy: user.email,
                ownerId: user.uid,
                storagePath: filePath
            });

            this.addFileToList({
                id: fileId,
                name: file.name,
                url: downloadURL,
                size: this.formatFileSize(file.size),
                type: file.type,
                uploadedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading file: ' + error.message);
        }
    }

    async loadExistingFiles() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        try {
            const snapshot = await this.db.collection('files')
                .where('ownerId', '==', user.uid)
                .orderBy('uploadedAt', 'desc')
                .get();

            snapshot.forEach(doc => {
                this.addFileToList(doc.data());
            });
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    addFileToList(fileData) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        const url = fileData.url || '';
        const name = this.escapeHtml(fileData.name);
        const date = new Date(fileData.uploadedAt).toLocaleDateString();
        fileItem.innerHTML = `
            <div class="file-info">
                <h4>${name}</h4>
                <p>${fileData.size} • ${date}</p>
                <p><strong>Link:</strong> <a href="" target="_blank" rel="noopener"></a></p>
            </div>
            <button type="button" class="copy-btn">Copiar link</button>
        `;
        const link = fileItem.querySelector('.file-info a');
        link.href = url;
        link.textContent = url;
        const btn = fileItem.querySelector('.copy-btn');
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(url).then(() => { btn.textContent = 'Copiado'; });
        });
        this.filesList.appendChild(fileItem);
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

// Create and init MediaAdmin when user is authenticated (called from auth-simple.js)
window.initMediaAdmin = function () {
    if (!window.mediaAdmin) {
        window.mediaAdmin = new SimpleMediaAdmin();
    }
    window.mediaAdmin.init();
};
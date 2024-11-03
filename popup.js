import { PDFDocument } from 'pdf-lib';

class PDFSigner {
  constructor() {
    this.initializeElements();
    this.attachEventListeners();
    this.loadSavedSets();
  }

  initializeElements() {
    // Tab elements
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Signature elements
    this.signaturePreview = document.getElementById('signaturePreview');
    this.stampPreview = document.getElementById('stampPreview');
    this.uploadSignatureBtn = document.getElementById('uploadSignature');
    this.uploadStampBtn = document.getElementById('uploadStamp');

    // Text elements
    this.customText = document.getElementById('customText');
    this.fontFamily = document.getElementById('fontFamily');
    this.fontSize = document.getElementById('fontSize');
    this.boldBtn = document.getElementById('boldBtn');
    this.italicBtn = document.getElementById('italicBtn');
    this.textColor = document.getElementById('textColor');

    // Date elements
    this.includeDate = document.getElementById('includeDate');
    this.dateFormat = document.getElementById('dateFormat');
    this.customDate = document.getElementById('customDate');

    // Sets elements
    this.setsList = document.getElementById('signatureSets');
    this.setName = document.getElementById('setName');
    this.saveSetBtn = document.getElementById('saveSet');

    // Settings elements
    this.fixedPosition = document.getElementById('fixedPosition');
    this.createCopy = document.getElementById('createCopy');
  }

  attachEventListeners() {
    // Tab switching
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button));
    });

    // File uploads
    this.uploadSignatureBtn.addEventListener('click', () => this.uploadFile('signature'));
    this.uploadStampBtn.addEventListener('click', () => this.uploadFile('stamp'));

    // Text formatting
    this.customText.addEventListener('input', () => this.updatePreview());
    this.fontFamily.addEventListener('change', () => this.updatePreview());
    this.fontSize.addEventListener('input', () => this.updatePreview());
    this.boldBtn.addEventListener('click', () => this.toggleFormat('bold'));
    this.italicBtn.addEventListener('click', () => this.toggleFormat('italic'));
    this.textColor.addEventListener('input', () => this.updatePreview());

    // Date handling
    this.includeDate.addEventListener('change', () => this.toggleDateOptions());
    this.dateFormat.addEventListener('change', () => this.toggleCustomDate());

    // Set management
    this.saveSetBtn.addEventListener('click', () => this.saveCurrentSet());

    // Make signature and stamp draggable
    this.makeElementDraggable(this.signaturePreview);
    this.makeElementDraggable(this.stampPreview);
  }

  switchTab(button) {
    const tabName = button.dataset.tab;
    
    this.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  }

  async uploadFile(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = type === 'signature' ? this.signaturePreview : this.stampPreview;
          preview.style.backgroundImage = `url(${event.target.result})`;
          preview.style.backgroundSize = 'contain';
          preview.style.backgroundRepeat = 'no-repeat';
          preview.style.backgroundPosition = 'center';
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  }

  makeElementDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      const parent = element.parentElement;
      const newTop = element.offsetTop - pos2;
      const newLeft = element.offsetLeft - pos1;
      
      if (newTop >= 0 && newTop + element.offsetHeight <= parent.offsetHeight) {
        element.style.top = newTop + "px";
      }
      if (newLeft >= 0 && newLeft + element.offsetWidth <= parent.offsetWidth) {
        element.style.left = newLeft + "px";
      }
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  updatePreview() {
    const text = this.customText.value;
    const style = `
      font-family: ${this.fontFamily.value};
      font-size: ${this.fontSize.value}px;
      color: ${this.textColor.value};
      font-weight: ${this.boldBtn.classList.contains('active') ? 'bold' : 'normal'};
      font-style: ${this.italicBtn.classList.contains('active') ? 'italic' : 'normal'};
    `;
    
    this.signaturePreview.innerHTML = `<div style="${style}">${text}</div>`;
  }

  toggleFormat(format) {
    const button = format === 'bold' ? this.boldBtn : this.italicBtn;
    button.classList.toggle('active');
    this.updatePreview();
  }

  toggleDateOptions() {
    this.dateFormat.disabled = !this.includeDate.checked;
    this.toggleCustomDate();
  }

  toggleCustomDate() {
    this.customDate.disabled = !this.includeDate.checked || this.dateFormat.value !== 'custom';
  }

  async saveCurrentSet() {
    const name = this.setName.value.trim();
    if (!name) {
      alert('נא להזין שם לערכה');
      return;
    }

    const set = {
      name,
      signature: this.signaturePreview.style.backgroundImage,
      stamp: this.stampPreview.style.backgroundImage,
      text: {
        content: this.customText.value,
        fontFamily: this.fontFamily.value,
        fontSize: this.fontSize.value,
        color: this.textColor.value,
        bold: this.boldBtn.classList.contains('active'),
        italic: this.italicBtn.classList.contains('active')
      },
      date: {
        include: this.includeDate.checked,
        format: this.dateFormat.value,
        custom: this.customDate.value
      }
    };

    const sets = await this.getSavedSets();
    sets.push(set);
    await chrome.storage.local.set({ signatureSets: sets });
    
    this.loadSavedSets();
    this.setName.value = '';
  }

  async getSavedSets() {
    const result = await chrome.storage.local.get('signatureSets');
    return result.signatureSets || [];
  }

  async loadSavedSets() {
    const sets = await this.getSavedSets();
    this.setsList.innerHTML = sets.map((set, index) => `
      <div class="set-item">
        <span>${set.name}</span>
        <div>
          <button onclick="pdfSigner.loadSet(${index})">טען</button>
          <button onclick="pdfSigner.deleteSet(${index})">מחק</button>
        </div>
      </div>
    `).join('');
  }

  async loadSet(index) {
    const sets = await this.getSavedSets();
    const set = sets[index];
    
    this.signaturePreview.style.backgroundImage = set.signature;
    this.stampPreview.style.backgroundImage = set.stamp;
    
    this.customText.value = set.text.content;
    this.fontFamily.value = set.text.fontFamily;
    this.fontSize.value = set.text.fontSize;
    this.textColor.value = set.text.color;
    this.boldBtn.classList.toggle('active', set.text.bold);
    this.italicBtn.classList.toggle('active', set.text.italic);
    
    this.includeDate.checked = set.date.include;
    this.dateFormat.value = set.date.format;
    this.customDate.value = set.date.custom;
    
    this.toggleDateOptions();
    this.updatePreview();
  }

  async deleteSet(index) {
    if (!confirm('האם למחוק את הערכה?')) return;
    
    const sets = await this.getSavedSets();
    sets.splice(index, 1);
    await chrome.storage.local.set({ signatureSets: sets });
    
    this.loadSavedSets();
  }
}

const pdfSigner = new PDFSigner();
window.pdfSigner = pdfSigner;
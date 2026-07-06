(function () {
  'use strict';

  // State to track if the user has already submitted the form in this session
  let hasSubmitted = false;

  // Fix back button freeze (bfcache)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      const overlay = document.getElementById('expand-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        overlay.style.clipPath = '';
      }
    }
  });

  // CSS injection to guarantee styling works across all pages
  const injectStyles = () => {
    if (document.getElementById('contact-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'contact-modal-styles';
    style.textContent = `
      .contact-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(5, 14, 30, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.4s ease, visibility 0.4s ease;
      }
      .contact-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      .contact-modal-card {
        background: #1a2b4c;
        border: 1px solid #D4AF37;
        border-radius: 16px;
        padding: 2.2rem;
        max-width: 460px;
        width: 90%;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(212, 175, 55, 0.15);
        transform: scale(0.9);
        transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        position: relative;
      }
      .contact-modal-overlay.active .contact-modal-card {
        transform: scale(1);
      }
      .contact-modal-title {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 2rem;
        color: #f5cb5c;
        margin-bottom: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        text-align: center;
      }
      .contact-modal-desc {
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        color: #aab6d1;
        margin-bottom: 1.8rem;
        line-height: 1.5;
        text-align: center;
      }
      .contact-form-group {
        margin-bottom: 1.2rem;
        text-align: left;
      }
      .contact-form-label {
        display: block;
        font-family: 'Inter', sans-serif;
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #f5cb5c;
        margin-bottom: 0.4rem;
      }
      .contact-form-input {
        width: 100%;
        background: rgba(11, 29, 58, 0.6);
        border: 1px solid rgba(212, 175, 55, 0.25);
        border-radius: 8px;
        color: #f2ecdd;
        padding: 0.75rem 1rem;
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        transition: all 0.3s ease;
      }
      .contact-form-input:focus {
        outline: none;
        border-color: #D4AF37;
        background: rgba(11, 29, 58, 0.8);
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.15);
      }
      .contact-form-textarea {
        resize: vertical;
        min-height: 90px;
      }
      .contact-submit-btn {
        width: 100%;
        background: #D4AF37;
        color: #0b1d3a;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.85rem;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        margin-top: 0.6rem;
      }
      .contact-submit-btn:hover {
        background: #f5cb5c;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(212, 175, 55, 0.35);
      }
      .contact-submit-btn:active {
        transform: translateY(0);
      }
      .contact-close-x {
        position: absolute;
        top: 1rem;
        right: 1.2rem;
        background: transparent;
        border: none;
        color: #aab6d1;
        font-size: 1.4rem;
        cursor: pointer;
        transition: color 0.2s ease;
      }
      .contact-close-x:hover {
        color: #f5cb5c;
      }
      .success-message-container {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        text-align: center;
        animation: fadeIn 0.4s ease forwards;
      }
      .success-check-icon {
        font-size: 3rem;
        color: #28c840;
        margin-bottom: 1.2rem;
        animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      .success-text {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 1.6rem;
        color: #f2ecdd;
        line-height: 1.4;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  };

  document.addEventListener('click', function (e) {
    // Intercept contact buttons, but EXCLUDE the ones inside the footer
    const contactBtn = e.target.closest('a[href^="mailto:zorzigiordano@gmail.com"]');
    if (!contactBtn) return;
    if (contactBtn.closest('.site-footer')) return;

    e.preventDefault();
    injectStyles();

    // Create modal element if not exists
    let overlay = document.getElementById('contact-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'contact-modal-overlay';
      overlay.className = 'contact-modal-overlay';
      overlay.innerHTML = `
        <div class="contact-modal-card">
          <button class="contact-close-x" id="modal-close-x" aria-label="Chiudi">&times;</button>
          
          <!-- Form Content -->
          <div id="modal-form-content">
            <h3 class="contact-modal-title">Contattami</h3>
            <p class="contact-modal-desc">Sentiamoci e ti risponderò al più presto.</p>
            
            <form id="contact-modal-form" name="contact-portfolio" novalidate>
              <div class="contact-form-group">
                <label class="contact-form-label" for="contact-name">Il tuo nome</label>
                <input class="contact-form-input" type="text" id="contact-name" name="nome" placeholder="Es. Mario Rossi" required>
              </div>
              
              <div class="contact-form-group">
                <label class="contact-form-label" for="contact-email">La tua email</label>
                <input class="contact-form-input" type="email" id="contact-email" name="email" placeholder="Es. mario@email.com" required>
              </div>
              
              <div class="contact-form-group">
                <label class="contact-form-label" for="contact-job">Di cosa ti occupi?</label>
                <input class="contact-form-input" type="text" id="contact-job" name="occupazione" placeholder="Es. Founder, HR Manager, Recruiter" required>
              </div>
              
              <div class="contact-form-group">
                <label class="contact-form-label" for="contact-hook">Cosa ti ha colpito del portfolio?</label>
                <input class="contact-form-input" type="text" id="contact-hook" name="colpito" placeholder="Es. Le automazioni CRM, i testi" required>
              </div>
              
              <div class="contact-form-group">
                <label class="contact-form-label" for="contact-message">Richieste / Domande</label>
                <textarea class="contact-form-input contact-form-textarea" id="contact-message" name="richiesta" placeholder="Scrivi qui le tue richieste..." required></textarea>
              </div>
              
              <button class="contact-submit-btn" type="submit">Invia</button>
            </form>
          </div>

          <!-- Success Content -->
          <div id="modal-success-content" class="success-message-container">
            <div class="success-check-icon">✓</div>
            <div class="success-text">
              Ho ricevuto le tue risposte, ci sentiamo a breve. Grazie
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Event: Close modal on X click
      const closeX = overlay.querySelector('#modal-close-x');
      const closeModal = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      };
      closeX.addEventListener('click', closeModal);

      // Close modal on background click
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closeModal();
      });

      // Form submission handling
      const form = overlay.querySelector('#contact-modal-form');
      const formContent = overlay.querySelector('#modal-form-content');
      const successContent = overlay.querySelector('#modal-success-content');

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        
        // Simple HTML5 validation check
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        // Collect data
        const formData = {
          nome: document.getElementById('contact-name').value,
          email: document.getElementById('contact-email').value,
          occupazione: document.getElementById('contact-job').value,
          colpito: document.getElementById('contact-hook').value,
          richiesta: document.getElementById('contact-message').value
        };

        // Netlify Forms URL encoding submission helper
        const encode = (data) => {
          return Object.keys(data)
            .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
            .join("&");
        };

        // Submit form data asynchronously to Netlify
        fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: encode({
            "form-name": "contact-portfolio",
            ...formData
          })
        })
        .then(() => {
          console.log("Modulo Netlify inviato con successo!");
        })
        .catch(error => {
          console.error("Errore nell'invio del modulo Netlify: ", error);
        });

        // Set state to true so we remember they submitted in this session
        hasSubmitted = true;

        // Animate out form, animate in success content
        formContent.style.display = 'none';
        successContent.style.display = 'flex';

        // Auto-close modal after 2.5 seconds
        setTimeout(() => {
          closeModal();
        }, 2500);
      });
    }

    // Handle view based on state
    const formContent = overlay.querySelector('#modal-form-content');
    const successContent = overlay.querySelector('#modal-success-content');

    if (hasSubmitted) {
      formContent.style.display = 'none';
      successContent.style.display = 'flex';
    } else {
      formContent.style.display = 'block';
      successContent.style.display = 'none';
    }

    // Open modal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
})();

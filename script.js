document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Custom Cursor Glow/Particles ---
    const cursor = document.getElementById('custom-cursor');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Only activate custom cursor on non-touch devices and if motion is allowed
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (!prefersReducedMotion && cursor && !isTouchDevice) {
        document.addEventListener('mousemove', (e) => {
            // Use requestAnimationFrame for smoother performance
            requestAnimationFrame(() => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });
        });
        
        // Hide cursor when it leaves window or hovers over clickable elements where we might want standard cursor
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
        });
    } else if (cursor) {
        cursor.style.display = 'none';
    }

    // --- 2. Hero Typing Effect ---
    const typingElement = document.getElementById('typing-text');
    const phrases = [
        "acelera tu carrera tech.",
        "crea el futuro hoy.",
        "lidera la innovación.",
        "construye proyectos reales."
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function typeEffect() {
        if (!typingElement) return;

        if (prefersReducedMotion) {
            // If reduced motion, just show the first phrase and stop
            typingElement.textContent = phrases[0];
            const cursorElem = document.querySelector('.cursor');
            if (cursorElem) cursorElem.style.display = 'none';
            return;
        }

        const currentPhrase = phrases[phraseIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50; // Faster deleting
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100; // Slower typing
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause at the end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typingSpeed = 500; // Pause before new phrase
        }

        setTimeout(typeEffect, typingSpeed);
    }

    if(typingElement) typeEffect();


    // --- 3. Chat Widget Logic ---
    const chatToggleBtn = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatCloseBtn = document.getElementById('chat-close');
    const chatBody = document.getElementById('chat-body');
    const chatIcon = document.querySelector('.chat-icon');
    const closeIcon = document.querySelector('.close-icon');

    const conversationScript = [
        { type: 'ia', text: '¡Hola! 👋 Soy Mentor IA, tu asistente virtual.' },
        { type: 'ia', text: 'Veo que te interesan nuestros cursos. ¿Estás buscando empezar desde cero o ya tienes experiencia?' },
        { type: 'user', text: 'Hola, me interesa desarrollo web desde cero.' },
        { type: 'ia', text: '¡Excelente elección! 🚀 Para comenzar sin experiencia, te recomiendo nuestro curso "Fullstack JS Master".' },
        { type: 'ia', text: 'Aprenderás a construir aplicaciones completas con tecnologías modernas. ¿Te gustaría ver el temario?' }
    ];

    let currentMsgIndex = 0;
    let chatTimeoutId = null;
    let isChatOpen = false;

    // Focus trap variables
    let focusableElements = [];
    let firstFocusableElement = null;
    let lastFocusableElement = null;

    if(chatWindow) {
        focusableElements = chatWindow.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        firstFocusableElement = focusableElements[0];
        lastFocusableElement = focusableElements[focusableElements.length - 1];
    }

    function toggleChat() {
        if(!chatWindow) return;

        isChatOpen = !isChatOpen;
        
        if (isChatOpen) {
            chatWindow.hidden = false;
            // Short timeout to allow display block to apply before adding class for animation
            setTimeout(() => {
                chatWindow.classList.add('show');
                chatToggleBtn.setAttribute('aria-expanded', 'true');
                chatIcon.classList.add('d-none');
                closeIcon.classList.remove('d-none');
                
                // Focus trap logic
                chatWindow.focus();
                
                if (currentMsgIndex === 0) {
                    startConversation();
                }
            }, 10);
        } else {
            chatWindow.classList.remove('show');
            chatToggleBtn.setAttribute('aria-expanded', 'false');
            chatIcon.classList.remove('d-none');
            closeIcon.classList.add('d-none');
            
            setTimeout(() => {
                chatWindow.hidden = true;
                chatToggleBtn.focus(); // Return focus
            }, 300); // Wait for transition
        }
    }

    if(chatToggleBtn) chatToggleBtn.addEventListener('click', toggleChat);
    if(chatCloseBtn) chatCloseBtn.addEventListener('click', toggleChat);

    // Escape to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isChatOpen) {
            toggleChat();
        }
    });

    // Basic Focus Trap inside chat window
    if(chatWindow) {
        chatWindow.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator id-typing';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatBody.appendChild(indicator);
        scrollToBottom();
        return indicator;
    }

    function removeTypingIndicator() {
        const indicator = chatBody.querySelector('.id-typing');
        if (indicator) {
            indicator.remove();
        }
    }

    function addMessage(msg) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${msg.type}`;
        msgDiv.textContent = msg.text;
        chatBody.appendChild(msgDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
    }

    function startConversation() {
        // Clear previous conversation if any
        chatBody.innerHTML = '';
        currentMsgIndex = 0;
        
        // Clear any running timeouts if user closes and opens quickly
        if(chatTimeoutId) {
            clearTimeout(chatTimeoutId);
        }
        
        function playNextMessage() {
            if (currentMsgIndex >= conversationScript.length) return;
            if (!isChatOpen) return; // Stop if closed
            
            const msg = conversationScript[currentMsgIndex];
            
            if (msg.type === 'ia') {
                const indicator = showTypingIndicator();
                // Simulate typing delay based on message length
                const delay = Math.min(600 + (msg.text.length * 20), 2000);
                
                chatTimeoutId = setTimeout(() => {
                    if(!isChatOpen) return;
                    removeTypingIndicator();
                    addMessage(msg);
                    currentMsgIndex++;
                    chatTimeoutId = setTimeout(playNextMessage, 800); // Wait before next action
                }, prefersReducedMotion ? 0 : delay);
            } else {
                // User message delay
                chatTimeoutId = setTimeout(() => {
                    if(!isChatOpen) return;
                    addMessage(msg);
                    currentMsgIndex++;
                    chatTimeoutId = setTimeout(playNextMessage, 500);
                }, prefersReducedMotion ? 0 : 1200);
            }
        }
        
        // Initial delay before first message
        chatTimeoutId = setTimeout(playNextMessage, 400);
    }
});

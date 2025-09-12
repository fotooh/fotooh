// script.js - تفعيل نموذج الاتصال وإرسال البريد الإلكتروني

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    // تعطيل الإرسال الافتراضي للنموذج
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });
    
    // إضافة تأثيرات للأسئلة السريعة
    const quickQuestions = document.querySelectorAll('.quick-question');
    quickQuestions.forEach(question => {
        question.addEventListener('click', function(e) {
            e.preventDefault();
            const questionText = this.textContent;
            document.getElementById('message').value = `أرغب في الاستفسار عن: ${questionText}`;
            document.getElementById('message').focus();
            
            // إضافة تأثير مرئي
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
        });
    });
});

// دالة التعامل مع إرسال النموذج
function handleFormSubmit() {
    // جمع بيانات النموذج
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value
    };
    
    // التحقق من صحة البيانات
    if (!validateForm(formData)) {
        return;
    }
    
    // إظهار حالة التحميل
    const submitButton = document.querySelector('#contactForm button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitButton.disabled = true;
    
    // إرسال البيانات إلى Formspree
    const formspreeEndpoint = 'https://formspree.io/f/meolvgel';
    
    fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            showNotification('تم إرسال رسالتك بنجاح. سنتواصل معك قريباً.', 'success');
            document.getElementById('contactForm').reset();
        } else {
            return response.json().then(err => {
                throw new Error(err.error || 'فشل في إرسال الرسالة');
            });
        }
    })
    .catch(error => {
        showNotification('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.', 'error');
        console.error('Error:', error);
    })
    .finally(() => {
        // إعادة تعيين زر الإرسال
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    });
}

// دالة التحقق من صحة البيانات
function validateForm(formData) {
    // التحقق من الاسم
    if (formData.name.trim().length < 3) {
        showNotification('الرجاء إدخال اسم صحيح (3 أحرف على الأقل)', 'error');
        document.getElementById('name').focus();
        return false;
    }
    
    // التحقق من البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showNotification('الرجاء إدخال بريد إلكتروني صحيح', 'error');
        document.getElementById('email').focus();
        return false;
    }
    
    // التحقق من الرسالة
    if (formData.message.trim().length < 10) {
        showNotification('الرجاء إدخال رسالة مفصلة (10 أحرف على الأقل)', 'error');
        document.getElementById('message').focus();
        return false;
    }
    
    return true;
}

// دالة لعرض الإشعارات
function showNotification(message, type) {
    // إنصراف العنصر إذا لم يكن موجوداً
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
        
        // إضافة أنماط الإشعار إذا لم تكن موجودة
        if (!document.getElementById('notificationStyles')) {
            const styles = document.createElement('style');
            styles.id = 'notificationStyles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 25px;
                    border-radius: 5px;
                    color: white;
                    z-index: 10000;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.3s ease;
                    max-width: 400px;
                    direction: rtl;
                }
                
                .notification.success {
                    background-color: #2ecc71;
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .notification.error {
                    background-color: #e74c3c;
                    opacity: 1;
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    notification.textContent = message;
    notification.className = 'notification ' + type;
    
    // إخفاء الإشعار تلقائياً بعد 5 ثوان
    setTimeout(() => {
        notification.className = 'notification';
    }, 5000);
}

// دالة مساعدة لإضافة تأثيرات على حقول الإدخال
function initInputEffects() {
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        // تأثير عند التركيز على الحقل
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        // تأثير عند الخروج من الحقل
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // تهيئة الحالة الأولية
        if (input.value !== '') {
            input.parentElement.classList.add('focused');
        }
    });
}

// تهيئة التأثيرات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initInputEffects();
});
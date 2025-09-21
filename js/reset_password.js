     import { supabase } from '../../js/supabase.js';

    const resetForm = document.getElementById('resetForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const passwordStrengthBar = document.getElementById('passwordStrength');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const messageContainer = document.getElementById('messageContainer');
    const confirmError = document.getElementById('confirmError');

    // إصلاح مشكلة إظهار/إخفاء كلمة المرور
    togglePasswordBtn.addEventListener('click', function() {
      const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      newPasswordInput.setAttribute('type', type);
      this.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
    });

    toggleConfirmPasswordBtn.addEventListener('click', function() {
      const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      confirmPasswordInput.setAttribute('type', type);
      this.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
    });

    // التحقق من قوة كلمة المرور
    newPasswordInput.addEventListener('input', function() {
      const password = this.value;
      checkPasswordStrength(password);
      validatePasswords();
    });

    confirmPasswordInput.addEventListener('input', validatePasswords);

    function checkPasswordStrength(password) {
      let strength = 0;
      const requirements = {
        length: password.length >= 8,
        upperCase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password)
      };

      // تحديث مؤشر القوة
      if (requirements.length) strength += 33;
      if (requirements.upperCase) strength += 33;
      if (requirements.number) strength += 34;

      passwordStrengthBar.style.width = strength + '%';
      
      if (strength < 33) {
        passwordStrengthBar.style.background = '#dc3545';
      } else if (strength < 66) {
        passwordStrengthBar.style.background = '#ffc107';
      } else {
        passwordStrengthBar.style.background = '#28a745';
      }

      // تحديث أيقونات المتطلبات
      document.getElementById('reqLength').className = requirements.length ? 'requirement met' : 'requirement';
      document.getElementById('reqUpperCase').className = requirements.upperCase ? 'requirement met' : 'requirement';
      document.getElementById('reqNumber').className = requirements.number ? 'requirement met' : 'requirement';
      
      if (requirements.length) {
        document.getElementById('reqLength').innerHTML = '<i class="fas fa-check-circle"></i><span>8 أحرف على الأقل</span>';
      } else {
        document.getElementById('reqLength').innerHTML = '<i class="fas fa-circle"></i><span>8 أحرف على الأقل</span>';
      }
      
      if (requirements.upperCase) {
        document.getElementById('reqUpperCase').innerHTML = '<i class="fas fa-check-circle"></i><span>حرف كبير واحد على الأقل</span>';
      } else {
        document.getElementById('reqUpperCase').innerHTML = '<i class="fas fa-circle"></i><span>حرف كبير واحد على الأقل</span>';
      }
      
      if (requirements.number) {
        document.getElementById('reqNumber').innerHTML = '<i class="fas fa-check-circle"></i><span>رقم واحد على الأقل</span>';
      } else {
        document.getElementById('reqNumber').innerHTML = '<i class="fas fa-circle"></i><span>رقم واحد على الأقل</span>';
      }
    }

    function validatePasswords() {
      const password = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      if (confirmPassword && password !== confirmPassword) {
        confirmError.textContent = 'كلمتا المرور غير متطابقتين';
        return false;
      } else {
        confirmError.textContent = '';
        return true;
      }
    }

    function showMessage(message, type) {
      messageContainer.innerHTML = `
        <div class="message ${type}">
          <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
          ${message}
        </div>
      `;
    }

    // إعادة تعيين كلمة المرور
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const access_token = hashParams.get("access_token")
    const refresh_token = hashParams.get("refresh_token")

  if (access_token && refresh_token) {
    // إنشاء جلسة جديدة باستخدام التوكن
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    })
    if (error) {
      console.error("Error setting session:", error.message)
    } else {
      console.log("Session set successfully:", data)
    }
  }
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      // التحقق من صحة المدخلات
      if (newPassword.length < 8) {
        showMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
        return;
      }
      
      if (!validatePasswords()) {
        return;
      }
      
      // عرض حالة التحميل
      submitBtn.disabled = true;
      btnText.textContent = 'جاري تعيين كلمة المرور...';
      btnSpinner.style.display = 'inline-block';
      
      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        
        showMessage('تم تغيير كلمة المرور بنجاح، يمكنك تسجيل الدخول الآن', 'success');
        
        // الانتقال إلى صفحة تسجيل الدخول بعد ثانيتين
         setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
          
      } catch (err) {
        showMessage('خطأ: ' + err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        btnText.textContent = 'تغيير كلمة المرور';
        btnSpinner.style.display = 'none';
      }
    });

    // تهيئة الصفحة
    document.addEventListener('DOMContentLoaded', function() {
      // وضع التركيز على حقل كلمة المرور
      newPasswordInput.focus();
    });
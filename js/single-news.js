import {supabase} from './supabase.js'; // تأكد أن المسار صحيح

document.addEventListener('DOMContentLoaded', async () => {
  // استخراج ID الخبر من عنوان الصفحة
  const params = new URLSearchParams(window.location.search);
  const newsId = params.get('id');

  // عناصر الصفحة التي سنملأها ديناميكياً
  const badge = document.querySelector('.news-badge');
  const title = document.querySelector('.news-title');
  const date = document.querySelector('.news-date');
  const image = document.querySelector('.news-image img');
  const content = document.querySelector('.news-content');

  // التحقق من وجود ID
  if (!newsId) {
    content.innerHTML = '<p>لا يوجد خبر لعرضه.</p>';
    return;
  }

  // جلب الخبر من Supabase
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', newsId)
    .single();

  if (error || !data) {
    content.innerHTML = '<p>حدث خطأ أثناء تحميل تفاصيل الخبر.</p>';
    console.error('Supabase Error:', error);
    return;
  }

  // تعبئة عناصر الصفحة بالبيانات
  badge.textContent = translateCategory(data.category);
  title.textContent = data.title;
  date.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(data.created_at)}`;
  image.src = data.image_url;
  image.alt = data.title;

  content.innerHTML = `
    <p>${data.excerpt || ''}</p>
    <div>${data.content || ''}</div>
  `;
  // إظهار قسم التسجيل إذا كانت الدورة من نوع "courses"
if (data.category === 'course') {
    const registrationSection = document.getElementById('courseRegistrationSection');
    const registerBtn = document.getElementById('registerCourseBtn');
    
    registrationSection.style.display = 'block';
    
    registerBtn.addEventListener('click', function() {
        window.location.href = `../course-registration.html?courseId=${data.id}&courseName=${encodeURIComponent(data.title)}`;
    });
}
});

// تنسيق التاريخ
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('ar-EG', options);
}

// ترجمة التصنيفات
function translateCategory(category) {
  const categories = {
    course: 'دورة',
    workshop: 'ورشة',
    announcement: 'إعلان'
  };
  return categories[category] || 'أخرى';
}
// --- عرض الصورة عند النقر عليها ---
document.addEventListener('click', function(e) {
  const img = e.target.closest('.news-image img');
  if (!img) return;

  // إنشاء عنصر overlay
  const overlay = document.createElement('div');
  overlay.classList.add('image-overlay');

  // إنشاء نسخة مكبرة من الصورة
  const largeImg = document.createElement('img');
  largeImg.src = img.src;
  largeImg.alt = img.alt;
  largeImg.classList.add('large-image');

  // زر إغلاق
  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '&times;';
  closeBtn.classList.add('close-btn');

  overlay.appendChild(largeImg);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  // إغلاق عند النقر على الزر أو خارج الصورة
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay || ev.target === closeBtn) {
      overlay.remove();
    }
  });
});

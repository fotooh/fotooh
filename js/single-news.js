import {supabase} from './supabase.js';

// متغيرات عامة للمعرض
let currentGalleryImages = [];
let currentGalleryIndex = 0;
let currentNewsData = null; // تخزين بيانات الخبر

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const newsId = params.get('id');

    const badge = document.querySelector('.news-badge');
    const title = document.querySelector('.news-title');
    const date = document.querySelector('.news-date');
    const image = document.querySelector('.news-image img');
    const content = document.querySelector('.news-content');
    const additionalImagesSection = document.getElementById('additionalImagesSection');
    const additionalImagesGrid = document.getElementById('additionalImagesGrid');

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

    currentNewsData = data; // حفظ البيانات للمعرض

    // تعبئة عناصر الصفحة بالبيانات
    badge.textContent = translateCategory(data.category);
    title.textContent = data.title;
    date.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(data.created_at)}`;
    
    // الصورة الرئيسية
    if (data.image_url) {
        image.src = data.image_url;
        image.alt = data.title;
        image.style.cursor = 'pointer';
        image.addEventListener('click', () => openGallery(getAllImagesFromData(data), 0));
    } else {
        image.style.display = 'none';
    }

    content.innerHTML = data.content || '<p>لا يوجد محتوى.</p>';

    // عرض الصور الإضافية
    displayAdditionalImages(data.additional_images, additionalImagesSection, additionalImagesGrid);

    // إظهار قسم التسجيل إذا كانت الدورة من نوع "course"
    if (data.category === 'course') {
        const registrationSection = document.getElementById('courseRegistrationSection');
        const registerBtn = document.getElementById('registerCourseBtn');
        
        registrationSection.style.display = 'block';
        
        registerBtn.addEventListener('click', function() {
            window.location.href = `../course-registration.html?courseId=${data.id}&courseName=${encodeURIComponent(data.title)}`;
        });
    }
});

// جمع جميع الصور من البيانات مباشرة (بدون الاعتماد على DOM)
// جمع جميع الصور من البيانات مباشرة (بدون الاعتماد على DOM)
function getAllImagesFromData(data) {
    const allImages = [];
    
    // إضافة الصورة الرئيسية أولاً إذا موجودة
    if (data.image_url && data.image_url.trim() !== '') {
        allImages.push(data.image_url);
    }
    
    // إضافة الصور الإضافية
    if (data.additional_images) {
        if (Array.isArray(data.additional_images)) {
            // إذا كانت مصفوفة مباشرة
            data.additional_images.forEach(imgUrl => {
                if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '') {
                    allImages.push(imgUrl);
                }
            });
        } else if (typeof data.additional_images === 'string') {
            // إذا كانت سلسلة نصية (JSON)
            try {
                const parsedImages = JSON.parse(data.additional_images);
                if (Array.isArray(parsedImages)) {
                    parsedImages.forEach(imgUrl => {
                        if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '') {
                            allImages.push(imgUrl);
                        }
                    });
                }
            } catch (error) {
                console.error('خطأ في تحليل الصور الإضافية:', error);
            }
        }
    }
    
    return allImages;
}

// عرض الصور الإضافية
function displayAdditionalImages(additionalImages, section, container) {
    if (!additionalImages || !Array.isArray(additionalImages) || additionalImages.length === 0) {
        section.style.display = 'none';
        return;
    }

    // تنظيف الحاوية أولاً
    container.innerHTML = '';
    
    // تصفية الصور الفارغة
    const validImages = additionalImages.filter(imgUrl => 
        imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== ''
    );
    
    if (validImages.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    // إضافة الصور إلى الشبكة
    validImages.forEach((imgUrl, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'additional-image-item';
        imageItem.innerHTML = `
            <img src="${imgUrl}" alt="صورة إضافية ${index + 1}" loading="lazy">
        `;
        
        imageItem.addEventListener('click', () => {
            const allImages = getAllImagesFromData(currentNewsData);
            // إيجاد الفهرس الصحيح للصورة في المجموعة الكاملة
            const imageIndex = allImages.findIndex(img => img === imgUrl);
            openGallery(allImages, Math.max(0, imageIndex));
        });
        
        container.appendChild(imageItem);
    });
    
    section.style.display = 'block';
}

// فتح معرض الصور
function openGallery(images, startIndex = 0) {
    if (!images || images.length === 0) return;
    
    currentGalleryImages = images;
    currentGalleryIndex = startIndex;
    
    // إنشاء overlay المعرض
    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';
    
    overlay.innerHTML = `
        <div class="gallery-container">
            <button class="gallery-close" title="إغلاق (Esc)">&times;</button>
            <button class="gallery-nav gallery-prev" title="الصورة السابقة (←)">&lsaquo;</button>
            <div class="gallery-image-container">
                <img class="gallery-image" src="${images[startIndex]}" alt="معرض الصور">
            </div>
            <button class="gallery-nav gallery-next" title="الصورة التالية (→)">&rsaquo;</button>
            <div class="gallery-counter">${startIndex + 1} / ${images.length}</div>
            <div class="gallery-controls">
                <button class="gallery-btn" id="galleryZoomOut" title="تصغير">−</button>
                <button class="gallery-btn" id="galleryZoomIn" title="تكبير">+</button>
                <button class="gallery-btn" id="galleryRotate" title="تدوير">↻</button>
                <button class="gallery-btn" id="galleryDownload" title="تحميل">⤓</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // إضافة معالجات الأحداث
    setupGalleryEvents(overlay);
}

// إعداد معالجات أحداث المعرض
function setupGalleryEvents(overlay) {
    const closeBtn = overlay.querySelector('.gallery-close');
    const prevBtn = overlay.querySelector('.gallery-prev');
    const nextBtn = overlay.querySelector('.gallery-next');
    const galleryImage = overlay.querySelector('.gallery-image');
    const counter = overlay.querySelector('.gallery-counter');
    const zoomInBtn = overlay.querySelector('#galleryZoomIn');
    const zoomOutBtn = overlay.querySelector('#galleryZoomOut');
    const rotateBtn = overlay.querySelector('#galleryRotate');
    const downloadBtn = overlay.querySelector('#galleryDownload');
    
    let scale = 1;
    let rotation = 0;
    
    // تحديث تحويلات الصورة
    function updateImageTransform() {
        galleryImage.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
    }
    
    // إعادة تعيين التكبير والتدوير عند تغيير الصورة
    function resetImageTransform() {
        scale = 1;
        rotation = 0;
        updateImageTransform();
    }
    
    // إغلاق المعرض
    function closeGallery() {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyboardNavigation);
        overlay.remove();
    }
    
    // التنقل بين الصور
    function showPrevImage() {
        currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
        updateGalleryImage();
    }
    
    function showNextImage() {
        currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
        updateGalleryImage();
    }
    
    function updateGalleryImage() {
        resetImageTransform();
        galleryImage.src = currentGalleryImages[currentGalleryIndex];
        counter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
        
        // إضافة تأثير fade
        galleryImage.style.opacity = '0';
        setTimeout(() => {
            galleryImage.style.opacity = '1';
        }, 50);
    }
    
    function handleKeyboardNavigation(e) {
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'Escape') closeGallery();
        if (e.key === ' ') showNextImage(); // المسافة للصورة التالية
    }
    
    // معالجات الأحداث
    closeBtn.addEventListener('click', closeGallery);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeGallery();
    });
    
    prevBtn.addEventListener('click', showPrevImage);
    nextBtn.addEventListener('click', showNextImage);
    
    // التحكم في التكبير
    zoomInBtn.addEventListener('click', () => {
        scale = Math.min(scale + 0.25, 3);
        updateImageTransform();
    });
    
    zoomOutBtn.addEventListener('click', () => {
        scale = Math.max(scale - 0.25, 0.5);
        updateImageTransform();
    });
    
    // التدوير
    rotateBtn.addEventListener('click', () => {
        rotation = (rotation + 90) % 360;
        updateImageTransform();
    });
    
    // تحميل الصورة
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = currentGalleryImages[currentGalleryIndex];
        link.download = `image-${currentGalleryIndex + 1}.jpg`;
        link.click();
    });
    
    // التنقل بالسهمين على الكيبورد
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // التنقل بالسحب على الهواتف
    let touchStartX = 0;
    let touchEndX = 0;
    
    overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    overlay.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                showNextImage(); // سحب لليسار → صورة تالية
            } else {
                showPrevImage(); // سحب لليمين → صورة سابقة
            }
        }
    }
}

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
        announcement: 'إعلان',
        news: 'خبر'
    };
    return categories[category] || 'أخرى';
}
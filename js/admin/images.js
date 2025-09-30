import { supabase } from '../supabase.js';

let currentImage = null;
let uploadedImageUrl = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

async function checkAuth() {
    // التحقق من جلسة المستخدم
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session) {
        // إذا لم يكن المستخدم مسجلاً، توجيه إلى صفحة تسجيل الدخول
        window.location.href = 'login.html';
        return;
    }
    
    // إذا كان المستخدم مسجلاً، تحميل الصور وإعداد الأحداث
    loadImages();
    setupEventListeners();
}

function setupEventListeners() {
    // رفع الصور
    const uploadArea = document.getElementById('uploadArea');
    const imageUpload = document.getElementById('imageUpload');
    
    uploadArea.addEventListener('click', () => imageUpload.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#3498db';
        uploadArea.style.background = 'rgba(52, 152, 219, 0.1)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#dee2e6';
        uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#dee2e6';
        uploadArea.style.background = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });
    
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });
    
    // نموذج الصورة
    document.getElementById('addImageBtn').addEventListener('click', () => {
        openImageModal();
    });
    
    document.getElementById('cancelBtn').addEventListener('click', () => {
        closeImageModal();
    });
    
    document.getElementById('imageForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveImage();
    });

    // تسجيل الخروج
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });
}

async function handleImageUpload(file) {
    // إظهار رسالة التنبيه
const uploadStatus = document.getElementById('uploadStatus');
const statusMessage = document.getElementById('statusMessage');
uploadStatus.style.display = 'block';
statusMessage.textContent = 'جاري رفع الصورة، يرجى عدم إغلاق الصفحة...';
    if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار ملف صورة فقط');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5MB');
        return;
    }
    
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const progressText = document.getElementById('progressText');
    const uploadArea = document.getElementById('uploadArea');
    
    // إظهار شريط التقدم وإعداد الواجهة
    progressBar.style.display = 'block';
    progress.style.width = '0%';
    progressText.textContent = 'يرجى الانتظار... جاري معالجة الصورة';
    
    // تعطيل منطقة الرفع مؤقتاً
    uploadArea.style.opacity = '0.7';
    uploadArea.style.pointerEvents = 'none';
    
    try {
        // التحقق من الجلسة أولاً
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        // تحديث حالة التقدم
        progressText.textContent = 'جاري تحضير الصورة للرفع...';
        
        // رفع الصورة إلى Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `gallery/${fileName}`;
        
        // محاكاة التقدم
        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += 5;
            if (progressValue <= 90) {
                progress.style.width = `${progressValue}%`;
                
                // تحديث النص بناءً على نسبة التقدم
                if (progressValue < 30) {
                    progressText.textContent = 'جاري معالجة الصورة...';
                } else if (progressValue < 60) {
                    progressText.textContent = 'جاري رفع الصورة إلى الخادم...';
                } else {
                    progressText.textContent = 'جاري حفظ البيانات...';
                }
            }
        }, 200);
        
        // رفع الملف الفعلي
        const { data, error } = await supabase.storage
            .from('images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        // إيقاف محاكاة التقدم
        clearInterval(progressInterval);
        
        if (error) throw error;
        
        // إكمال شريط التقدم
        progress.style.width = '95%';
        progressText.textContent = 'جاري إنشاء رابط الصورة...';
        
        // الحصول على رابط الصورة
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
        
        uploadedImageUrl = publicUrl;
        
        // إكمال التقدم بنجاح
        setTimeout(() => {
            progress.style.width = '100%';
            progressText.textContent = 'تم الرفع بنجاح! ✓';
            progress.style.background = '#2ecc71';
            
            setTimeout(() => {
                progressBar.style.display = 'none';
                uploadArea.style.opacity = '1';
                uploadArea.style.pointerEvents = 'auto';
                openImageModal();
            }, 1000);
            
        }, 500);
        uploadStatus.style.display = 'none';
        
    } catch (error) {
        console.error('Error uploading image:', error);
        
        // عرض حالة الخطأ
        progress.style.width = '100%';
        progress.style.background = '#e74c3c';
        progressText.textContent = 'فشل في رفع الصورة! ✗';
        
        setTimeout(() => {
            progressBar.style.display = 'none';
            uploadArea.style.opacity = '1';
            uploadArea.style.pointerEvents = 'auto';
            alert(`حدث خطأ أثناء رفع الصورة: ${error.message}`);
        }, 1500);
    }
}

function openImageModal(image = null) {
    currentImage = image;
    const modal = document.getElementById('imageModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (image) {
        modalTitle.textContent = 'تعديل الصورة';
        document.getElementById('imageTitle').value = image.title;
        document.getElementById('imageDescription').value = image.description || '';
        document.getElementById('imageCategory').value = image.category;
        uploadedImageUrl = image.image_url;
    } else {
        modalTitle.textContent = 'إضافة صورة جديدة';
        document.getElementById('imageForm').reset();
    }
    
    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    currentImage = null;
    uploadedImageUrl = null;
    document.getElementById('imageUpload').value = '';
}

async function saveImage() {
    const title = document.getElementById('imageTitle').value;
    const description = document.getElementById('imageDescription').value;
    const category = document.getElementById('imageCategory').value;
    
    if (!title) {
        alert('الرجاء إدخال عنوان للصورة');
        return;
    }
    
    if (!uploadedImageUrl && !currentImage) {
        alert('الرجاء رفع صورة أولاً');
        return;
    }
    
    try {
        // التحقق من الجلسة مرة أخرى
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error('انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى');
        }

        const imageData = {
            title,
            description,
            category,
            image_url: uploadedImageUrl || currentImage.image_url,
            created_at: new Date().toISOString()
        };
        
        let error;
        
        if (currentImage) {
            // تحديث الصورة
            ({ error } = await supabase
                .from('gallery_images')
                .update(imageData)
                .eq('id', currentImage.id));
        } else {
            // إضافة صورة جديدة
            ({ error } = await supabase
                .from('gallery_images')
                .insert([imageData]));
        }
        
        if (error) throw error;
        
        closeImageModal();
        loadImages();
        alert(currentImage ? 'تم تحديث الصورة بنجاح' : 'تم إضافة الصورة بنجاح');
        
    } catch (error) {
        console.error('Error saving image:', error);
        alert(`حدث خطأ أثناء حفظ الصورة: ${error.message}`);
    }
}

async function loadImages() {
    try {
        const { data: images, error } = await supabase
            .from('gallery_images')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayImages(images || []);
    } catch (error) {
        console.error('Error loading images:', error);
        alert('حدث خطأ أثناء تحميل الصور');
    }
}

function displayImages(images) {
    const imagesGrid = document.getElementById('imagesGrid');
    
    if (images.length === 0) {
        imagesGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #6c757d;">لا توجد صور مضافة بعد</p>';
        return;
    }
    
    imagesGrid.innerHTML = images.map(image => `
        <div class="image-card">
            <div class="image-preview">
                <img src="${image.image_url}" alt="${image.title}" loading="lazy">
            </div>
            <div class="image-info">
                <div class="image-title">${image.title}</div>
                <div class="image-description">${image.description || 'لا يوجد وصف'}</div>
                <span class="image-category">${getCategoryName(image.category)}</span>
                <div class="image-actions">
                    <button class="btn btn-sm btn-edit" onclick="editImage('${image.id}')">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteImage('${image.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getCategoryName(category) {
    const categories = {
        'activities': 'أنشطة المؤسسة',
        'events': 'الفعاليات',
        'training': 'التدريب',
        'therapy': 'العلاج النفسي',
        'other': 'أخرى'
    };
    return categories[category] || category;
}

async function editImage(id) {
    try {
        const { data: image, error } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        openImageModal(image);
    } catch (error) {
        console.error('Error loading image:', error);
        alert('حدث خطأ أثناء تحميل بيانات الصورة');
    }
}

async function deleteImage(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    
    try {
        // التحقق من الجلسة
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            throw new Error('انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى');
        }

        // أولاً: جلب بيانات الصورة لمعرفة مسار الملف
        const { data: image, error: fetchError } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('id', id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // ثانياً: حذف الملف من التخزين
        if (image.image_url) {
            const filePath = image.image_url.split('/').pop();
            const { error: storageError } = await supabase.storage
                .from('images')
                .remove([`gallery/${filePath}`]);
            
            if (storageError) {
                console.error('Error deleting file from storage:', storageError);
            }
        }
        
        // ثالثاً: حذف السجل من قاعدة البيانات
        const { error } = await supabase
            .from('gallery_images')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        loadImages();
        alert('تم حذف الصورة بنجاح');
    } catch (error) {
        console.error('Error deleting image:', error);
        alert(`حدث خطأ أثناء حذف الصورة: ${error.message}`);
    }
}

// جعل الدوال متاحة عالمياً
window.editImage = editImage;
window.deleteImage = deleteImage;
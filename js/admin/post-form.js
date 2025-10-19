// ../../js/admin/post-form.js
import { supabase } from '../supabase.js';
import { addPost, updatePost } from './posts.js';

export function initializePostForm() {
    initializeTinyMCE(); // تغيير من initializeCKEditor إلى initializeTinyMCE
    setupImagePreviews();
    setupFormSubmission();
    loadExistingData();
}

function initializeTinyMCE() {
    const postContentTextarea = document.getElementById('postContent');
    if (!postContentTextarea) return;

    if (typeof tinymce === 'undefined') {
        console.error('TinyMCE لم يتم تحميله');
        postContentTextarea.setAttribute('required', 'required');
        return;
    }

    // إزالة خاصية required من textarea مؤقتاً
    postContentTextarea.removeAttribute('required');

    tinymce.init({
        selector: '#postContent',
        // language: 'ar', // إزالة هذا السطر مؤقتاً
        directionality: 'rtl',
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount',
            'directionality'
        ],
        toolbar: 'undo redo | blocks | bold italic underline strikethrough | ' +
                 'alignleft aligncenter alignright alignjustify | ' +
                 'bullist numlist outdent indent | forecolor backcolor | ' +
                 'link image media table | ' +
                 'fontselect fontsizeselect | ' +
                 'ltr rtl | removeformat help | code',
        menubar: 'file edit view insert format tools table',
        toolbar_mode: 'sliding',
        height: 500,
        image_advtab: true,
        link_assume_external_targets: true,
        link_default_target: '_blank',
        paste_data_images: true,
        automatic_uploads: false,
        content_style: `
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                text-align: right;
            }
            h1, h2, h3, h4, h5, h6 {
                margin: 10px 0;
                color: #2c3e50;
            }
            p {
                margin-bottom: 10px;
            }
        `,
        setup: function (editor) {
            editor.on('init', function () {
                console.log('تم تحميل TinyMCE بنجاح');
                window.editor = editor;
                
                // إضافة تسميات عربية مخصصة
                customizeArabicLabels(editor);
            });

            editor.on('change', function () {
                validateEditorContent(editor);
            });

            editor.on('keyup', function () {
                validateEditorContent(editor);
            });
        }
    });
}

// دالة لإضافة تسميات عربية مخصصة
function customizeArabicLabels(editor) {
    // تخصيص تسميات القوائم
    const customLabels = {
        'File': 'ملف',
        'Edit': 'تحرير',
        'View': 'عرض',
        'Insert': 'إدراج',
        'Format': 'تنسيق',
        'Tools': 'أدوات',
        'Table': 'جدول',
        'Help': 'مساعدة',
        'Bold': 'عريض',
        'Italic': 'مائل',
        'Underline': 'تحته خط',
        'Strikethrough': 'خط في الوسط',
        'Undo': 'تراجع',
        'Redo': 'إعادة',
        'Bullet list': 'قائمة نقطية',
        'Numbered list': 'قائمة رقمية',
        'Link': 'رابط',
        'Image': 'صورة',
        'Table': 'جدول',
        'Code': 'كود',
        'Preview': 'معاينة',
        'Fullscreen': 'ملء الشاشة'
    };

    // تطبيق التسميات المخصصة
    Object.keys(customLabels).forEach(key => {
        const elements = editor.editorContainer.querySelectorAll(`[aria-label="${key}"]`);
        elements.forEach(element => {
            element.setAttribute('aria-label', customLabels[key]);
            element.setAttribute('title', customLabels[key]);
        });
    });
}

// التحقق من محتوى المحرر - تصحيح للTinyMCE
function validateEditorContent(editor) {
    const content = editor.getContent().trim();
    const postContentTextarea = document.getElementById('postContent');
    
    if (content === '' || content === '<p><br></p>' || content === '<p>&nbsp;</p>') {
        postContentTextarea.setCustomValidity('محتوى الخبر مطلوب');
    } else {
        postContentTextarea.setCustomValidity('');
    }
}

// إعداد معاينات الصور
function setupImagePreviews() {
    // الصورة الرئيسية
    const mainImageInput = document.getElementById('postImage');
    const mainImagePreview = document.getElementById('imagePreview');
    
    if (mainImageInput && mainImagePreview) {
        mainImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    mainImagePreview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
                };
                reader.readAsDataURL(file);
            } else {
                mainImagePreview.innerHTML = '<span>لا توجد صورة مختارة</span>';
            }
        });
    }

    // الصور الإضافية
    const additionalImagesInput = document.getElementById('additionalImages');
    const additionalPreviewContainer = document.getElementById('imagesPreviewContainer');
    
    if (additionalImagesInput && additionalPreviewContainer) {
        additionalImagesInput.addEventListener('change', handleAdditionalImagesChange);
        additionalPreviewContainer.addEventListener('click', handleRemoveImage);
    }
}

function handleAdditionalImagesChange(e) {
    const files = e.target.files;
    const previewContainer = document.getElementById('imagesPreviewContainer');
    previewContainer.innerHTML = '';
    
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="معاينة الصورة">
                    <button type="button" class="remove-image" data-index="${i}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        }
    }
}

function handleRemoveImage(e) {
    if (e.target.closest('.remove-image')) {
        const removeBtn = e.target.closest('.remove-image');
        const index = parseInt(removeBtn.getAttribute('data-index'));
        removeImageFromPreview(index);
    }
}

function removeImageFromPreview(index) {
    const imagesInput = document.getElementById('additionalImages');
    const dt = new DataTransfer();
    const files = imagesInput.files;
    
    for (let i = 0; i < files.length; i++) {
        if (i !== index) {
            dt.items.add(files[i]);
        }
    }
    
    imagesInput.files = dt.files;
    const event = new Event('change');
    imagesInput.dispatchEvent(event);
}

// إعداد إرسال النموذج - تصحيح للTinyMCE
function setupFormSubmission() {
    const form = document.getElementById('addPostForm') || document.getElementById('editPostForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // التحقق من صحة النموذج يدوياً
        if (!validateForm()) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            
            // الحصول على المحتوى من المحرر - تصحيح للTinyMCE
            if (window.editor) {
                const content = window.editor.getContent().trim();
                if (content === '' || content === '<p><br></p>' || content === '<p>&nbsp;</p>') {
                    throw new Error('محتوى الخبر مطلوب');
                }
                formData.set('postContent', content);
            }

            if (form.id === 'addPostForm') {
                await addPost(formData);
            } else {
                const postId = document.getElementById('postId').value;
                await updatePost(postId, formData);
            }
        } catch (error) {
            console.error('حدث خطأ في معالجة النموذج:', error);
            alert('فشل في حفظ الخبر: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// التحقق من صحة النموذج - تصحيح للTinyMCE
function validateForm() {
    const title = document.getElementById('postTitle').value.trim();
    const type = document.getElementById('postType').value;
    const date = document.getElementById('postDate').value;
    const status = document.getElementById('postStatus').value;
    
    let content = '';
    if (window.editor) {
        content = window.editor.getContent().trim(); // تغيير من getData إلى getContent
    }

    // التحقق من الحقول المطلوبة
    if (!title) {
        alert('عنوان الخبر مطلوب');
        document.getElementById('postTitle').focus();
        return false;
    }

    if (!type) {
        alert('نوع الخبر مطلوب');
        document.getElementById('postType').focus();
        return false;
    }

    if (!date) {
        alert('تاريخ النشر مطلوب');
        document.getElementById('postDate').focus();
        return false;
    }

    if (!content || content === '<p><br></p>' || content === '<p>&nbsp;</p>') {
        alert('محتوى الخبر مطلوب');
        if (window.editor) {
            window.editor.focus(); // تغيير من editor.editing.view.focus إلى editor.focus
        }
        return false;
    }

    if (!status) {
        alert('حالة الخبر مطلوبة');
        document.getElementById('postStatus').focus();
        return false;
    }

    return true;
}

// تحميل البيانات الموجودة (لصفحة التعديل)
function loadExistingData() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");
    
    if (postId) {
        document.getElementById("postId").value = postId;
        loadPostData(postId);
    }
}

async function loadPostData(id) {
    try {
        const { data, error } = await supabase.from("news").select("*").eq("id", id).single();
        if (error) throw error;

        // تعبئة الحقول الأساسية
        document.getElementById("postTitle").value = data.title || '';
        document.getElementById("postType").value = data.category || '';
        document.getElementById("postStatus").value = data.status || '';
        document.getElementById("postDate").value = data.created_at ? data.created_at.split("T")[0] : '';
        document.getElementById("postTags").value = data.tags || '';

        // تعبئة المحرر - تصحيح للTinyMCE
        if (window.editor) {
            window.editor.setContent(data.content || '');
        }

        // عرض الصورة الرئيسية
        if (data.image_url) {
            const imagePreview = document.getElementById("imagePreview");
            imagePreview.innerHTML = `<img src="${data.image_url}" alt="معاينة الصورة">`;
        }

        // معالجة الصور الإضافية
        const existingImagesInput = document.getElementById("existingAdditionalImages");
        const imagesContainer = document.getElementById("imagesPreviewContainer");
        
        let additionalImages = ensureArray(data.additional_images);
        
        existingImagesInput.value = JSON.stringify(additionalImages);
        displayAdditionalImages(additionalImages);

    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        alert('حدث خطأ في تحميل بيانات الخبر');
    }
}

// دالة مساعدة لضمان أن القيمة مصفوفة
function ensureArray(value) {
    if (Array.isArray(value)) {
        return value;
    }
    
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    
    return [];
}

function displayAdditionalImages(images) {
    const imagesContainer = document.getElementById("imagesPreviewContainer");
    if (!imagesContainer) return;
    
    imagesContainer.innerHTML = '';
    
    if (images && images.length > 0) {
        images.forEach((imgUrl, index) => {
            if (imgUrl && typeof imgUrl === 'string') {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `
                    <img src="${imgUrl}" alt="صورة إضافية ${index + 1}">
                    <button type="button" class="remove-existing-image" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                imagesContainer.appendChild(previewItem);
            }
        });
    }
}

// التهيئة عند تحميل الصفحة - إزالة الاستدعاء المزدوج
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePostForm);
} else {
    initializePostForm();
}
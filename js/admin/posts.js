import {supabase} from '../supabase.js';
import { logout, checkAuth } from './auth.js';
import { requirePermission } from './permissions.js';

// تنسيقات مساعدة
function formatDate(dateStr) {
  const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('ar-EG', options);
}

function translateCategory(category) {
  const map = {
    course: 'دورة',
    workshop: 'ورشة',
    announcement: 'إعلان',
    news:'خبر'
  };
  return map[category] || 'أخرى';
}

function translateStatus(status) {
  return status === 'draft' ? 'مسودة' : 'منشور';
}
export function setupAddPostForm() {
  const form = document.getElementById('addPostForm');
  if (!form) {
    console.log('لم يتم العثور على نموذج الإضافة في هذه الصفحة');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // إظهار مؤشر التحميل
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    submitBtn.disabled = true;

    try {
      const formData = new FormData(form);
      await addPost(formData);
    } catch (error) {
      console.error('حدث خطأ في معالجة النموذج:', error);
    } finally {
      // إعادة حالة الزر
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

export {
  addPost,
  loadPosts,
  deletePost
};
// تحميل الأخبار
async function loadPosts() {
  try {
    if (!document.getElementById('newsTableBody')) return;

    const { data: posts, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tableBody = document.getElementById('newsTableBody');
    tableBody.innerHTML = posts?.length > 0
      ? posts.map((post, index) => `
          <tr data-id="${post.id}">
            <td>${index + 1}</td>
            <td>
                <div class="post-title">${post.title}</div>
                ${post.tags ? `<div class="post-tags"><small>${post.tags}</small></div>` : ''}
            </td>
            <td><span class="badge badge-${post.category}">${translateCategory(post.category)}</span></td>
            <td>${formatDate(post.created_at)}</td>
            <td><span class="badge badge-${post.status}">${translateStatus(post.status)}</span></td>
            <td>
              <div class="action-buttons">
                <a href="edit.html?id=${post.id}" class="btn btn-sm btn-edit" title="تعديل">
                    <i class="fas fa-edit"></i>
                    <span class="btn-text">تعديل</span>
                </a>
                <button class="btn btn-sm btn-delete" title="حذف">
                    <i class="fas fa-trash"></i>
                    <span class="btn-text">حذف</span>
                </button>
              </div>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6"><div class="no-data">لا توجد أخبار.</div></td></tr>`;

    // تحديث معلومات الترقيم
    updateTableInfo(posts.length);
    
    // إعداد البحث والترقيم
    setupSearch(posts);
    setupPagination(posts);

  } catch (error) {
    console.error('حدث خطأ أثناء تحميل الأخبار:', error);
    const tableBody = document.getElementById('newsTableBody');
    tableBody.innerHTML = `<tr><td colspan="6"><div class="no-data">حدث خطأ في تحميل البيانات.</div></td></tr>`;
  }
}
// تحديث معلومات الجدول
function updateTableInfo(totalCount) {
    const currentCount = document.getElementById('currentCount');
    const totalCountEl = document.getElementById('totalCount');
    
    if (currentCount && totalCountEl) {
        currentCount.textContent = totalCount;
        totalCountEl.textContent = totalCount;
    }
}
// إعداد الترقيم
function setupPagination(posts) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    // هنا يمكنك إضافة منطق الترقيم إذا كنت تريد تقسيم البيانات إلى صفحات
    // حالياً نعرض جميع البيانات في صفحة واحدة
}

// إعداد معالجات الحذف مرة واحدة فقط
function setupDeleteHandlers() {
  const tableBody = document.getElementById('newsTableBody');
  if (!tableBody) return;

  tableBody.addEventListener('click', async (e) => {
    if (e.target.closest('.btn-delete')) {
      const row = e.target.closest('tr');
      const postId = row.getAttribute('data-id');
      if (confirm('هل أنت متأكد من حذف هذا الخبر؟')) {
        await deletePost(postId);
      }
    }
  });
}

// حذف خبر
async function deletePost(postId) {
  try {
    const { error } = await supabase.from('news').delete().eq('id', postId);
    if (error) throw error;

    alert('تم حذف الخبر بنجاح');
    await loadPosts();
  } catch (error) {
    console.error('خطأ في حذف الخبر:', error);
    alert('فشل في حذف الخبر: ' + error.message);
  }
}

// البحث والفلترة (لصفحة index.html فقط)
function setupSearch(posts) {
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('categoryFilter');

  if (!searchInput || !filterSelect) return;

  const performSearch = () => {
    const search = searchInput.value.toLowerCase();
    const category = filterSelect.value;

    const filtered = posts.filter(post =>
      (post.title.toLowerCase().includes(search) ||
       (post.tags && post.tags.toLowerCase().includes(search))) &&
      (category === 'all' || post.category === category)
    );

    const tableBody = document.getElementById('newsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = filtered.length > 0 
      ? filtered.map((post, index) => `
          <tr data-id="${post.id}">
            <td>${index + 1}</td>
            <td>
                <div class="post-title">${post.title}</div>
                ${post.tags ? `<div class="post-tags"><small>${post.tags}</small></div>` : ''}
            </td>
            <td><span class="badge badge-${post.category}">${translateCategory(post.category)}</span></td>
            <td>${formatDate(post.created_at)}</td>
            <td><span class="badge badge-${post.status}">${translateStatus(post.status)}</span></td>
            <td>
              <div class="action-buttons">
                <a href="edit.html?id=${post.id}" class="btn btn-sm btn-edit" title="تعديل">
                    <i class="fas fa-edit"></i>
                    <span class="btn-text">تعديل</span>
                </a>
                <button class="btn btn-sm btn-delete" title="حذف">
                    <i class="fas fa-trash"></i>
                    <span class="btn-text">حذف</span>
                </button>
              </div>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6"><div class="no-data">لا توجد نتائج للبحث.</div></td></tr>`;
      
    updateTableInfo(filtered.length);
  };

  searchInput.addEventListener('input', performSearch);
  filterSelect.addEventListener('change', performSearch);
}

// ------------------ إضافة خبر ------------------
async function addPost(formData) {
  try {
    // --- بيانات الحقول ---
    const title = formData.get('postTitle');
    const category = formData.get('postType');
    const date = formData.get('postDate');
let content = '';
const editorInstance = tinymce.get('postContent');
if (editorInstance) {
  content = editorInstance.getContent();
} else {
  content = formData.get('postContent') || '';
  console.warn('لم يتم العثور على محرر TinyMCE، استخدام textarea عادي');
}

    const tags = formData.get('postTags');
    const status = formData.get('postStatus');

    // --- رفع الصورة الرئيسية ---
    let imageUrl = '';
    const imageFile = formData.get('postImage');
    if (imageFile && imageFile.name) {
      imageUrl = await uploadImage(imageFile);
    }

    // --- رفع الصور الإضافية ---
    const additionalImages = formData.getAll('additionalImages');
    const additionalImageUrls = [];
    
    for (const imageFile of additionalImages) {
      if (imageFile && imageFile.name) {
        const url = await uploadImage(imageFile);
        additionalImageUrls.push(url);
      }
    }

    // --- إدخال البيانات في جدول news ---
    const { error: insertError } = await supabase
      .from('news')
      .insert([{
        title,
        category,
        created_at: date,
        content,
        tags,
        status,
        image_url: imageUrl,
        additional_images: additionalImageUrls // حقل جديد في قاعدة البيانات
      }]);

    if (insertError) throw insertError;

    alert('✅ تم إضافة الخبر بنجاح!');
    window.location.href = 'index.html';
  } catch (err) {
    console.error('❌ خطأ في إضافة الخبر:', err.message);
    alert('فشل في إضافة الخبر: ' + err.message);
  }
}

// دالة مساعدة لرفع الصور
export async function uploadImage(imageFile) {
    const fileName = `${Date.now()}_${imageFile.name}`;
    const { data, error } = await supabase.storage
        .from('news-images')
        .upload(fileName, imageFile);

    if (error) throw error;

    const { data: publicUrl } = supabase
        .storage
        .from('news-images')
        .getPublicUrl(fileName);

    return publicUrl.publicUrl;
}


// إعداد معالجات القائمة الجانبية
function setupSidebarHandlers() {
    // تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                await logout();
            }
        });
    }
    
    // إزالة النشاط من جميع عناصر القائمة وإضافته للعنصر الحالي
    const menuItems = document.querySelectorAll('.admin-menu a');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

async function init() {
  try {
    console.log('تهيئة الصفحة...');
    
    // التحقق من المصادقة أولاً
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;
    
    // إعداد معالجات القائمة الجانبية
    setupSidebarHandlers();
    
    // تحميل الأخبار فقط إذا كنا في صفحة الفهرس
    if (window.location.pathname.includes('index.html')) {
      await loadPosts();
      setupDeleteHandlers(); 
    }
    
    // إعداد نموذج الإضافة فقط إذا كنا في صفحة الإضافة
    if (window.location.pathname.includes('add.html')) {
      setupAddPostForm();
    }
    
  } catch (error) {
    console.error('حدث خطأ أثناء تهيئة الصفحة:', error);
  }
}
// بدء التطبيق بعد تحميل DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// تعديل خبر
// تعديل خبر
export async function updatePost(id, formData) {
  try {
    // الحصول على البيانات الحالية أولاً
    const { data: existingPost, error: fetchError } = await supabase
      .from('news')
      .select('image_url, additional_images')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    // --- التعامل مع الصورة الرئيسية ---
    let imageUrl = existingPost.image_url; // استخدام الصورة الحالية كقيمة افتراضية
    const imageFile = formData.get('postImage');
    
    // إذا تم رفع صورة جديدة، استبدل الصورة القديمة
    if (imageFile && imageFile.name) {
      imageUrl = await uploadImage(imageFile);
    }

    // --- التعامل مع الصور الإضافية ---
    const additionalImages = formData.getAll('additionalImages');
    
    // التأكد أن additionalImageUrls هي مصفوفة
    let additionalImageUrls = Array.isArray(existingPost.additional_images) 
      ? [...existingPost.additional_images] // نسخ المصفوفة الحالية
      : []; // إذا كانت null أو غير مصفوفة، إنشاء مصفوفة فارغة
    
    // إضافة الصور الجديدة
    for (const imageFile of additionalImages) {
      if (imageFile && imageFile.name) {
        const url = await uploadImage(imageFile);
        additionalImageUrls.push(url);
      }
    }

    // الحصول المحتوى من المحرر
    let content = '';
    if (window.editor && typeof window.editor.getData === 'function') {
      content = window.editor.getData().trim();
    } else {
      content = formData.get('postContent') || '';
    }

    // تحديث البيانات
    const { error } = await supabase
      .from('news')
      .update({
        title: formData.get('postTitle'),
        content: content,
        category: formData.get('postType'),
        status: formData.get('postStatus'),
        tags: formData.get('postTags'),
        image_url: imageUrl,
        additional_images: additionalImageUrls
      })
      .eq('id', id);

    if (error) throw error;

    alert('✅ تم تعديل الخبر بنجاح!');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('❌ خطأ في تعديل الخبر:', error);
    alert('فشل في تعديل الخبر: ' + error.message);
  }
}


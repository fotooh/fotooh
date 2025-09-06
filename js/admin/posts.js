import supabase from '../supabase.js';
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
    const formData = new FormData(form);
    try {
      await addPost(formData);
    } catch (error) {
      console.error('حدث خطأ في معالجة النموذج:', error);
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
            <td>${post.title}</td>
            <td><span class="badge badge-${post.category}">${translateCategory(post.category)}</span></td>
            <td>${formatDate(post.created_at)}</td>
            <td><span class="badge badge-${post.status}">${translateStatus(post.status)}</span></td>
            <td>
              <a href="edit.html?id=${post.id}" class="btn btn-sm btn-edit"><i class="fas fa-edit"></i></a>
              <button class="btn btn-sm btn-delete"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6">لا توجد أخبار.</td></tr>`;

    setupSearch(posts);

  } catch (error) {
    console.error('حدث خطأ أثناء تحميل الأخبار:', error);
  }
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
      post.title.toLowerCase().includes(search) &&
      (category === 'all' || post.category === category)
    );

    const tableBody = document.getElementById('newsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = filtered.length > 0 
      ? filtered.map((post, index) => `
          <tr data-id="${post.id}">
            <td>${index + 1}</td>
            <td>${post.title}</td>
            <td><span class="badge badge-${post.category}">${translateCategory(post.category)}</span></td>
            <td>${formatDate(post.created_at)}</td>
            <td><span class="badge badge-${post.status}">${translateStatus(post.status)}</span></td>
            <td>
              <a href="edit.html?id=${post.id}" class="btn btn-sm btn-edit"><i class="fas fa-edit"></i></a>
              <button class="btn btn-sm btn-delete"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('')
      : `<tr><td colspan="6">لا توجد نتائج بحث.</td></tr>`;
  };

  searchInput.addEventListener('input', () =>performSearch());
  filterSelect.addEventListener('change', () =>performSearch());
}

// ------------------ إضافة خبر ------------------
async function addPost(formData) {
  const imageFile = formData.get('postImage');
  let imageUrl = '';

  if (imageFile && imageFile.name) {
    const fileName = `${Date.now()}_${imageFile.name}`;
    const { error: uploadError } = await supabase
      .storage
      .from('news-images')
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error('خطأ في رفع الصورة:', uploadError);
      alert('حدث خطأ أثناء رفع الصورة');
      return;
    }

    imageUrl = supabase
      .storage
      .from('news-images')
      .getPublicUrl(fileName).data.publicUrl;
  }

  const title = formData.get('postTitle');
  const content = formData.get('postContent');
  const type = formData.get('postType');     // ✅ مطلوب
  const status = formData.get('postStatus');
  const category = formData.get('postType'); // إذا عندك حقل كاتيجوري في النموذج

  const { error } = await supabase
    .from('news')
    .insert([{ 
      title, 
      content, 
      type,        // ✅ لازم يتعبى
      status, 
      category,    // إذا عندك input اسمه postCategory
      image_url: imageUrl 
    }]);

  if (error) {
    console.error('خطأ في الإضافة:', error);
    alert('فشل في إضافة الخبر');
  } else {
    alert('تمت الإضافة بنجاح');
    window.location.href = 'index.html';
  }
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

// تحديث دالة init لإضافة معالجات القائمة
async function init() {
    try {
        console.log('تهيئة الصفحة...');
        
        // التحقق من المصادقة أولاً
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;
         // التحقق من صلاحية الوصول للصفحة
        // await requirePermission('view_dashboard');
        //  // إخفاء عناصر القائمة الجانبية
        // await hideMenuElementsByPermission();
        
        // // تحميل المحتوى
        // await loadContent();
        
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
            setupImagePreview(); 
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
export async function updatePost(id, formData) {
  const imageFile = formData.get('postImage');
  let imageUrl = formData.get('existingImageUrl') || ''; // احتفظ بالصورة القديمة لو ما رفع صورة جديدة

  if (imageFile && imageFile.name) {
    const fileName = `${Date.now()}_${imageFile.name}`;
    const { error: uploadError } = await supabase
      .storage
      .from('news-images')
      .upload(fileName, imageFile);

    if (uploadError) {
      console.error('خطأ في رفع الصورة:', uploadError);
      alert('حدث خطأ أثناء رفع الصورة');
      return;
    }

    imageUrl = supabase
      .storage
      .from('news-images')
      .getPublicUrl(fileName).data.publicUrl;
  }

  const { error } = await supabase
    .from('news')
    .update({
      title: formData.get('postTitle'),
      content: formData.get('postContent'),
      type: formData.get('postType'),
      status: formData.get('postStatus'),
      category: formData.get('postType'),
      image_url: imageUrl
    })
    .eq('id', id);

  if (error) {
    console.error('خطأ في التعديل:', error);
    alert('فشل في تعديل الخبر');
  } else {
    alert('تم تعديل الخبر بنجاح');
    window.location.href = 'index.html';
  }
}

function setupImagePreview() {
    const imageInput = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    
    if (!imageInput || !imagePreview) return;
    
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة" style="max-width: 100%; max-height: 100%;">`;
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.innerHTML = '<span>لا توجد صورة مختارة</span>';
        }
    });
}
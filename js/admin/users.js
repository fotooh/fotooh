// js/admin/users.js
import supabase from '../supabase.js';
import { logout, checkAuth, getCurrentUser } from './auth.js';
import { 
    hideMenuElementsByPermission, 
    requirePermission, 
    checkCurrentPagePermission,
    getCurrentUserPermissions 
} from './permissions.js';

// تنسيق التاريخ
function formatDate(dateStr) {
    const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('ar-EG', options);
}

// تحميل المستخدمين
async function loadUsers() {
    try {
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = users?.length > 0
            ? users.map((user, index) => `
                <tr data-id="${user.id}">
                    <td>${index + 1}</td>
                    <td>${user.full_name || 'غير معروف'}</td>
                    <td>${user.email || 'غير معروف'}</td>
                    <td><span class="badge badge-${user.role || 'user'}">${translateRole(user.role)}</span></td>
                    <td>${formatDate(user.created_at)}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" data-user-id="${user.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-delete" data-user-id="${user.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('')
            : `<tr><td colspan="6">لا يوجد مستخدمون.</td></tr>`;

        setupUserHandlers();

    } catch (error) {
        console.error('حدث خطأ أثناء تحميل المستخدمين:', error);
        alert('فشل في تحميل المستخدمين');
    }
}

// ترجمة الدور
function translateRole(role) {
    const roles = {
        admin: 'مدير',
        editor: 'محرر',
        user: 'مستخدم'
    };
    return roles[role] || 'مستخدم';
}

// إعداد معالجات الأزرار
function setupUserHandlers() {
    // زر إضافة مستخدم
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showUserModal();
        });
    }

    // أزرار التعديل والحذف
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.closest('.btn-edit').dataset.userId;
            editUser(userId);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const userId = e.target.closest('.btn-delete').dataset.userId;
            if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                await deleteUser(userId);
            }
        });
    });
}

// عرض نموذج إضافة/تعديل مستخدم
function showUserModal(user = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
            <form id="userForm">
                <div class="form-group">
                    <label>الاسم الكامل</label>
                    <input type="text" name="fullName" value="${user?.full_name || ''}" required>
                </div>
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" name="email" value="${user?.email || ''}" required>
                </div>
                <div class="form-group">
                    <label>كلمة المرور</label>
                    <input type="password" name="password" ${user ? 'placeholder="اتركه فارغاً للحفاظ على كلمة المرور الحالية"' : 'required'}>
                </div>
                <div class="form-group">
    <label>الدور والصلاحيات</label>
    <select name="role" id="roleSelect" required">
        <option value="user">مستخدم عادي</option>
        <option value="author">كاتب</option>
        <option value="editor">محرر</option>
        <option value="admin">مدير</option>
    </select>
</div>

<div class="form-group" id="permissionsSection">
    <label>الصلاحيات الممنوحة:</label>
    <div class="permissions-list" id="permissionsList">
        <!-- سيتم ملء الصلاحيات تلقائياً -->
    </div>
</div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                    <button type="submit" class="btn btn-primary">${user ? 'تحديث' : 'إضافة'}</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    const roleSelect = modal.querySelector('#roleSelect');
    roleSelect.addEventListener('change', updatePermissions);

     // أول مرة عند فتح النموذج
    updatePermissions();


    const form = modal.querySelector('#userForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        
        if (user) {
            await updateUser(user.id, formData);
        } else {
            await addUser(formData);
        }
        
        modal.remove();
    });
}

// إضافة مستخدم جديد
// إضافة مستخدم جديد مع الصلاحيات
async function addUser(formData) {
    try {
        const email = formData.get('email');
        const password = formData.get('password');
        const fullName = formData.get('fullName');
        const role = formData.get('role');
        
        // تحديد الصلاحيات حسب الدور
        const permissions = getPermissionsByRole(role);

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    permissions: permissions
                }
            }
        });

        if (error) throw error;

        // إضافة بيانات إضافية إلى جدول profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: data.user.id,
                full_name: fullName,
                role: role,
                permissions: permissions,
                created_at: new Date().toISOString()
            }]);

        if (profileError) throw profileError;

        alert('تم إضافة المستخدم بنجاح');
        await loadUsers();

    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        alert('فشل في إضافة المستخدم: ' + error.message);
    }
}

// تحديد الصلاحيات حسب الدور
function getPermissionsByRole(role) {
    const permissions = {
        admin: [
            'view_dashboard',
            'view_posts',
            'manage_posts',
            'manage_users',
            'manage_settings',
            'edit_all_posts',
            'delete_all_posts'
        ],
        editor: [
            'view_dashboard',
            'view_posts',
            'manage_posts',
            'edit_own_posts',
            'delete_own_posts'
        ],
        author: [
            'view_dashboard',
            'view_posts',
            'create_posts',
            'edit_own_posts'
        ],
        user: [
            'view_dashboard'
        ]
    };
    
    return permissions[role] || permissions.user;
}
// تعديل مستخدم
async function updateUser(userId, formData) {
    try {
        const updates = {
            full_name: formData.get('fullName'),
            role: formData.get('role')
        };

        // إذا تم إدخال كلمة مرور جديدة
        if (formData.get('password')) {
            const { error } = await supabase.auth.updateUser({
                password: formData.get('password')
            });
            if (error) throw error;
        }

        // تحديث البيانات الإضافية
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;

        alert('تم تحديث المستخدم بنجاح');
        await loadUsers();

    } catch (error) {
        console.error('خطأ في تعديل المستخدم:', error);
        alert('فشل في تعديل المستخدم: ' + error.message);
    }
}

// حذف مستخدم
async function deleteUser(userId) {
    try {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;

        alert('تم حذف المستخدم بنجاح');
        await loadUsers();

    } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        alert('فشل في حذف المستخدم: ' + error.message);
    }
}

// إعداد معالجات القائمة الجانبية
function setupSidebarHandlers() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (confirm('هل تريد تسجيل الخروج؟')) {
                await logout();
            }
        });
    }
}

// تهيئة الصفحة
async function init() {
    try {
        // التحقق من المصادقة
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;
         // التحقق من صلاحية الوصول للصفحة
        // await requirePermission('view_dashboard');
        // await checkCurrentPagePermission();
        //  // إخفاء عناصر القائمة الجانبية
        // await hideMenuElementsByPermission();
        
        // تحميل المحتوى
       // await loadContent();

        // إعداد المعالجات
        setupSidebarHandlers();
        await loadUsers();

    } catch (error) {
        console.error('حدث خطأ أثناء تهيئة الصفحة:', error);
    }
}

// بدء التطبيق
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
// تحديث عرض الصلاحيات حسب الدور المختار
function updatePermissions() {
    const roleSelect = document.getElementById('roleSelect');
    const permissionsList = document.getElementById('permissionsList');
    const role = roleSelect.value;
    
    const permissions = {
        admin: [
            'إدارة المستخدمين',
            'إدارة جميع الأخبار',
            'إدارة الإعدادات',
            'عرض لوحة التحكم',
            'تعديل جميع الأخبار',
            'حذف جميع الأخبار'
        ],
        editor: [
            'إدارة الأخبار',
            'عرض لوحة التحكم',
            'تعديل الأخبار الخاصة',
            'حذف الأخبار الخاصة'
        ],
        author: [
            'إنشاء أخبار جديدة',
            'تعديل الأخبار الخاصة',
            'عرض لوحة التحكم'
        ],
        user: [
            'عرض لوحة التحكم'
        ]
    };
    
    const arabicPermissions = permissions[role] || permissions.user;
    
    permissionsList.innerHTML = arabicPermissions.map(permission => `
        <div class="permission-item">
            <i class="fas fa-check-circle"></i>
            <span>${permission}</span>
        </div>
    `).join('');
}

// تهيئة الصلاحيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('roleSelect')) {
        updatePermissions();
    }
});
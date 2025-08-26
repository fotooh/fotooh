// js/admin/permissions.js
import supabase from '../supabase.js';

// التحقق من صلاحية محددة
export async function hasPermission(permission) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('permissions, role')
            .eq('id', user.id)
            .single();

        if (!profile) return false;

        // المدير لديه جميع الصلاحيات
        if (profile.role === 'admin') return true;

        return profile.permissions?.includes(permission) || false;

    } catch (error) {
        console.error('خطأ في التحقق من الصلاحية:', error);
        return false;
    }
}

// التحقق من الدور
export async function hasRole(role) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role === role;

    } catch (error) {
        console.error('خطأ في التحقق من الدور:', error);
        return false;
    }
}

// الحصول على صلاحيات المستخدم الحالي
export async function getCurrentUserPermissions() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data: profile } = await supabase
            .from('profiles')
            .select('permissions, role')
            .eq('id', user.id)
            .single();

        if (profile?.role === 'admin') {
            // إرجاع جميع الصلاحيات للمدير
            return [
                'manage_users',
                'manage_posts',
                'manage_settings',
                'view_dashboard',
                'edit_all_posts',
                'delete_all_posts'
            ];
        }

        return profile?.permissions || [];

    } catch (error) {
        console.error('خطأ في الحصول على الصلاحيات:', error);
        return [];
    }
}

// منع الوصول إذا لم يكن لديه الصلاحية
export async function requirePermission(permission, redirectUrl = '../../auth/login.html') {
    const hasPerm = await hasPermission(permission);
    if (!hasPerm) {
        alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}
// إخفاء العناصر حسب الصلاحيات
export async function hideElementsByPermission() {
    const permissions = await getCurrentUserPermissions();
    
    // إخفاء أزرار الإدارة إذا لم يكن لديه الصلاحية
    if (!permissions.includes('manage_users')) {
        document.querySelectorAll('[data-permission="manage_users"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    if (!permissions.includes('manage_settings')) {
        document.querySelectorAll('[data-permission="manage_settings"]').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // إخفاء أزرار الحذف إذا لم يكن لديه الصلاحية
    if (!permissions.includes('delete_all_posts')) {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            // التحقق إذا كان يمكنه حذف فقط منشوراته
            if (!permissions.includes('delete_own_posts')) {
                btn.style.display = 'none';
            }
        });
    }
}
// إخفاء عناصر القائمة الجانبية حسب الصلاحيات
export async function hideMenuElementsByPermission() {
    const permissions = await getCurrentUserPermissions();
    
    // عناصر القائمة الجانبية
    const menuItems = {
        'view_dashboard': '[data-permission="view_dashboard"]',
        'view_posts': '[data-permission="view_posts"]',
        'manage_users': '[data-permission="manage_users"]',
        'manage_settings': '[data-permission="manage_settings"]'
    };
    
    // إخفاء العناصر التي لا يمتلك المستخدم صلاحيتها
    Object.entries(menuItems).forEach(([permission, selector]) => {
        if (!permissions.includes(permission)) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // إخفاء عنصر li الأب
                const listItem = el.closest('li');
                if (listItem) {
                    listItem.style.display = 'none';
                }
            });
        }
    });
    
    // إذا لم يكن لديه أي صلاحية للوحة التحكم، توجيه للصفحة الرئيسية
    if (permissions.length === 0) {
        window.location.href = 'https://example.com';
    }
}
// التحقق من صلاحية الصفحة الحالية
export async function checkCurrentPagePermission() {
    const currentPage = window.location.pathname.split('/').pop();
    const pagePermissions = {
        'index.html': 'view_posts',
        'add.html': 'create_posts',
        'edit.html': 'edit_own_posts',
        'users.html': 'manage_users',
        'settings.html': 'manage_settings',
        'dashboard.html': 'view_dashboard'
    };
    
    const requiredPermission = pagePermissions[currentPage];
    if (requiredPermission) {
        const hasPerm = await hasPermission(requiredPermission);
        if (!hasPerm) {
            alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
            window.location.href = '../dashboard.html';
            return false;
        }
    }
    return true;
}
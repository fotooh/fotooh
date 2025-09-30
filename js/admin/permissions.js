// js/admin/permissions.js
import {supabase} from '../supabase.js';

// تعريف الصلاحيات لكل دور
export const rolePermissions = {
    admin: [
        'view_dashboard',
        'view_posts',
        'manage_posts',
        'manage_images',
        'manage_users',
        'manage_settings',
        'edit_all_posts',
        'delete_all_posts',
        'system_settings',
        'user_management',
        'content_management'
    ],
    editor: [
        'view_dashboard',
        'view_posts',
        'manage_posts',
        'manage_images',
        'edit_own_posts',
        'delete_own_posts',
        'content_management'
    ],
    author: [
        'view_dashboard',
        'view_posts',
        'create_posts',
        'edit_own_posts',
        'content_management'
    ],
    user: [
        'view_dashboard'
    ]
};

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
                'view_dashboard',
                'view_posts',
                'manage_posts',
                'manage_images',
                'manage_users',
                'manage_settings',
                'edit_all_posts',
                'delete_all_posts',
                'system_settings',
                'user_management',
                'content_management'
            ];
        }

        return profile?.permissions || [];

    } catch (error) {
        console.error('خطأ في الحصول على الصلاحيات:', error);
        return [];
    }
}

// منع الوصول إذا لم يكن لديه الصلاحية
export async function requirePermission(permission, redirectUrl = '../../news/admin/login.html') {
    const hasPerm = await hasPermission(permission);
    if (!hasPerm) {
        alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

// إخفاء عناصر القائمة الجانبية حسب الصلاحيات
export async function hideMenuElementsByPermission() {
    const permissions = await getCurrentUserPermissions();
    
    // عناصر القائمة الجانبية
    const menuItems = {
        'view_posts': '[data-permission="view_posts"]',
        'manage_images': '[data-permission="manage_images"]',
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
}

// التحقق من صلاحية الصفحة الحالية
export async function checkCurrentPagePermission() {
    const currentPath = window.location.pathname;
    const pagePermissions = {
        'admin/index.html': 'view_posts',
        'admin/images.html': 'manage_images',
        'users/index.html': 'manage_users',
        'settings/index.html': 'manage_settings'
    };

    for (const [path, permission] of Object.entries(pagePermissions)) {
        if (currentPath.includes(path)) {
            const hasAccess = await hasPermission(permission);
            if (!hasAccess) {
                window.location.href = '../admin/unauthorized.html';
                return false;
            }
        }
    }
    return true;
}

// تصفية خيارات الإعدادات بناءً على الصلاحيات
export async function filterSettingsByPermission() {
    const permissions = await getCurrentUserPermissions();
    
    // إخفاء قسم الإعدادات تماماً إذا لم يكن لديه الصلاحية
    const settingsLink = document.querySelector('[data-permission="manage_settings"]');
    if (settingsLink && !permissions.includes('manage_settings')) {
        settingsLink.style.display = 'none';
        return;
    }

    // إذا كان المستخدم في صفحة الإعدادات، قم بتصفية الخيارات
    if (window.location.pathname.includes('settings/index.html')) {
        const settingSections = document.querySelectorAll('.settings-section');
        
        settingSections.forEach(section => {
            const sectionPermission = section.getAttribute('data-permission');
            if (sectionPermission && !permissions.includes(sectionPermission)) {
                section.style.display = 'none';
            }
        });

        // إخفاء الأزرار التي لا يملك صلاحيات لها
        const settingButtons = document.querySelectorAll('.setting-action');
        settingButtons.forEach(button => {
            const buttonPermission = button.getAttribute('data-permission');
            if (buttonPermission && !permissions.includes(buttonPermission)) {
                button.style.display = 'none';
            }
        });
    }
}

// الحصول على الدور الحالي للمستخدم
export async function getCurrentUserRole() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 'user';

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return profile?.role || 'user';
    } catch (error) {
        console.error('Error getting user role:', error);
        return 'user';
    }
}
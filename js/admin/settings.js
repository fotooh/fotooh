// js/admin/settings.js
import supabase from '../supabase.js';
import { logout, checkAuth } from './auth.js';
import { 
    hideMenuElementsByPermission, 
    requirePermission, 
    checkCurrentPagePermission,
    getCurrentUserPermissions 
} from './permissions.js';

// تحميل الإعدادات
async function loadSettings() {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        if (settings) {
            // تعبئة النموذج بالإعدادات
            const form = document.getElementById('settingsForm');
            Object.keys(settings).forEach(key => {
                if (form.elements[key]) {
                    form.elements[key].value = settings[key];
                }
            });
        }

    } catch (error) {
        console.error('حدث خطأ أثناء تحميل الإعدادات:', error);
    }
}

// حفظ الإعدادات
async function saveSettings(formData) {
    try {
        const settingsData = {
            institutionName: formData.get('institutionName'),
            institutionEmail: formData.get('institutionEmail'),
            institutionPhone: formData.get('institutionPhone'),
            institutionAddress: formData.get('institutionAddress'),
            updated_at: new Date().toISOString()
        };

        // التحقق من وجود إعدادات سابقة
        const { data: existingSettings } = await supabase
            .from('settings')
            .select('id')
            .single();

        let error;
        if (existingSettings) {
            // تحديث الإعدادات الموجودة
            ({ error } = await supabase
                .from('settings')
                .update(settingsData)
                .eq('id', existingSettings.id));
        } else {
            // إضافة إعدادات جديدة
            ({ error } = await supabase
                .from('settings')
                .insert([settingsData]));
        }

        if (error) throw error;

        alert('تم حفظ الإعدادات بنجاح');

    } catch (error) {
        console.error('خطأ في حفظ الإعدادات:', error);
        alert('فشل في حفظ الإعدادات: ' + error.message);
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

// إعداد معالجات النموذج
function setupFormHandlers() {
    const form = document.getElementById('settingsForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await saveSettings(formData);
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
        //await loadContent();

        // إعداد المعالجات
        setupSidebarHandlers();
        setupFormHandlers();
        await loadSettings();

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
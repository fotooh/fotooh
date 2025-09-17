import supabase from '../supabase.js';  

// تحسينات على وظيفة تسجيل الدخول
export async function login(email, password) {
  try {
    // التحقق من صحة المدخلات
    if (!email || !password) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      console.error('Login error:', error);
      // تحسين رسائل الخطأ للمستخدم
      const errorMsg = error.message.includes('Invalid login credentials') 
        ? 'بيانات الدخول غير صحيحة' 
        : error.message;
      return { error: new Error(errorMsg) };
    }

    // تسجيل معلومات إضافية عند نجاح الدخول
    console.log('User logged in:', data.user.email);
    return { data };

  } catch (error) {
    console.error('Unexpected login error:', error);
    return { error };
  }
}

// تحسينات على وظيفة تسجيل الخروج
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    }
    
    console.log('User logged out successfully');
    return { success: true };

  } catch (error) {
    console.error('Unexpected logout error:', error);
    return { success: false, error };
  }
}

// تحسينات على وظيفة التحقق من المصادقة
export async function checkAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth check error:', error);
      return { isAuthenticated: false, error };
    }
    
    return { 
      isAuthenticated: !!session,
      session,
      user: session?.user 
    };

  } catch (error) {
    console.error('Unexpected auth check error:', error);
    return { isAuthenticated: false, error };
  }
}

// وظيفة إضافية مفيدة: التحقق من الصلاحيات
export async function checkPermissions(userId, requiredRole) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.role === requiredRole;
}
// الحصول على معلومات المستخدم الحالي
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('خطأ في الحصول على بيانات المستخدم:', error);
        return null;
    }
}
// التحقق من صلاحيات المدير
export async function checkAdminAccess() {
    try {
        const user = await getCurrentUser();
        if (!user) return false;

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        
        return profile.role === 'admin';
    } catch (error) {
        console.error('خطأ في التحقق من الصلاحيات:', error);
        return false;
    }
}
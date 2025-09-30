import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
});

function initializePage() {
    // جلب بيانات الدورة من URL إذا كانت موجودة
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('courseId');
    const courseName = urlParams.get('courseName');
    
    if (courseId) {
        document.getElementById('courseId').value = courseId;
    }
    
    if (courseName) {
        document.getElementById('courseName').value = courseName;
        document.getElementById('courseTitle').textContent = courseName;
    }
    
    // جلب تفاصيل إضافية للدورة إذا كان هناك courseId
    if (courseId) {
        loadCourseDetails(courseId);
    }
}

function setupEventListeners() {
    const form = document.getElementById('registrationForm');
    form.addEventListener('submit', handleFormSubmit);
}

async function loadCourseDetails(courseId) {
    try {
        const { data: course, error } = await supabase
            .from('news')
            .select('*')
            .eq('id', courseId)
            .single();
        
        if (error) throw error;
        
        if (course) {
            updateCourseInfo(course);
        }
    } catch (error) {
        console.error('Error loading course details:', error);
    }
}

function updateCourseInfo(course) {
    const courseTitle = document.getElementById('courseTitle');
    const courseDate = document.getElementById('courseDate');
    const courseDuration = document.getElementById('courseDuration');
    const courseLocation = document.getElementById('courseLocation');
    
    courseTitle.textContent = course.title;
    
    // تحديث التاريخ إذا كان متوفراً في بيانات الدورة
    if (course.course_date) {
        courseDate.textContent = formatDate(course.course_date);
    }
    
    // تحديث مدة الدورة إذا كانت متوفرة
    if (course.duration) {
        courseDuration.textContent = `مدة الدورة: ${course.duration}`;
    }
    
    // تحديث الموقع إذا كان متوفراً
    if (course.location) {
        courseLocation.textContent = course.location;
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    // إخفاء الرسائل السابقة
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // تعطيل الزر أثناء الإرسال
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>جاري الإرسال...</span><div class="loading"></div>';
    
    try {
        // جمع بيانات النموذج
        const formData = new FormData(event.target);
        const registrationData = {
            full_name: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            age: parseInt(formData.get('age')),
            education: formData.get('education'),
            occupation: formData.get('occupation') || null,
            experience: formData.get('experience') || null,
            expectations: formData.get('expectations') || null,
            notes: formData.get('notes') || null,
            course_id: formData.get('courseId') || null,
            course_name: formData.get('courseName') || 'دورة تدريبية',
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // إرسال البيانات إلى Supabase
        const { data, error } = await supabase
            .from('course_registrations')
            .insert([registrationData]);
        
        if (error) throw error;
        
        // عرض رسالة النجاح
        successMessage.style.display = 'block';
        event.target.reset();
        
        // التمرير إلى أعلى الصفحة لعرض رسالة النجاح
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error submitting registration:', error);
        errorMessage.style.display = 'block';
        errorMessage.textContent = `حدث خطأ أثناء إرسال النموذج: ${error.message}`;
    } finally {
        // إعادة تمكين الزر
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>إرسال طلب التسجيل</span>';
    }
}

// دالة مساعدة لإضافة حدث التسجيل (ستستخدم من صفحة single.html)
window.registerForCourse = function(courseId, courseName) {
    const url = `course-registration.html?courseId=${courseId}&courseName=${encodeURIComponent(courseName)}`;
    window.location.href = url;
};
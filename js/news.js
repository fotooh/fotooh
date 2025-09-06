import supabase  from './supabase.js'; // تأكد أن المسار صحيح

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.news-grid');
  container.innerHTML = '<p>جاري تحميل الأخبار...</p>';

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = '<p>حدث خطأ أثناء تحميل الأخبار.</p>';
    console.error('Error fetching news:', error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<p>لا توجد أخبار حالياً.</p>';
    return;
  }

  const newsHTML = data.map((news) => {
    return `
      <article class="news-card" data-category="${news.category}">
        <div class="news-image">
          <img src="${news.image_url}" alt="${news.title}">
          <span class="news-badge">${translateCategory(news.category)}</span>
        </div>
        <div class="news-content">
          <div class="news-meta">
            <span class="news-date">${formatDate(news.created_at)}</span>
            <span class="news-author">بواسطة: ${news.author}</span>
          </div>
          <h2 class="news-title">${news.title}</h2>
          <p class="news-excerpt">${news.excerpt}</p>
          <a href="single.html?id=${news.id}" class="read-more">اقرأ المزيد</a>
        </div>
      </article>
    `;
  }).join('');

  container.innerHTML = newsHTML;
});

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('ar-EG', options);
}

function translateCategory(category) {
  const categories = {
    course: 'دورة',
    workshop: 'ورشة',
    announcement: 'إعلان',
    news:'خبر'
  };
  return categories[category] || 'أخرى';
}
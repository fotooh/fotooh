import { supabase } from './supabase.js';

async function loadGalleryImages() {
  try {
    const { data, error } = await supabase.from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (data?.length > 0) displayGalleryImages(data);
  } catch (err) {
    console.error('Error loading gallery images:', err);
  }
}

function displayGalleryImages(images) {
  document.querySelector('.gallery-grid').innerHTML = images.map(
    (img) => `
      <div class="gallery-item">
        <img src="${img.image_url}" alt="${img.title}" loading="lazy">
        <div class="overlay">
          <h3>${img.title}</h3>
          <p>${img.description || ''}</p>
        </div>
      </div>
    `
  ).join('');
}

document.addEventListener('DOMContentLoaded', loadGalleryImages);

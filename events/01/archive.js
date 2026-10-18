'use strict';

const photoLinks = [...document.querySelectorAll('[data-photo]')];
// Album navigation follows the source photo order, independently of page layout.
const album = [...photoLinks].sort((a, b) => Number(a.dataset.photo) - Number(b.dataset.photo));
const lightbox = document.querySelector('.lightbox');
const enlargedImage = document.querySelector('.lightbox-image');
const caption = document.querySelector('#lightbox-caption');
const count = document.querySelector('#lightbox-count');
let activePhoto = 0;

function showPhoto(index) {
  activePhoto = (index + album.length) % album.length;
  const link = album[activePhoto];
  enlargedImage.src = link.href;
  enlargedImage.alt = link.querySelector('img').alt;
  caption.textContent = link.closest('figure').querySelector('figcaption').firstElementChild?.textContent
    || link.closest('figure').querySelector('figcaption').textContent;
  count.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${album.length} · FORUM 01`;
}

if (typeof lightbox.showModal === 'function') {
  for (const link of photoLinks) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      showPhoto(album.indexOf(link));
      lightbox.showModal();
      document.body.classList.add('modal-open');
    });
  }
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(activePhoto - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(activePhoto + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(activePhoto + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  lightbox.addEventListener('close', () => document.body.classList.remove('modal-open'));
}

const chapterLinks = [...document.querySelectorAll('.chapter-links a')];
const chapters = chapterLinks.map(link => document.querySelector(link.hash));

function markChapter() {
  let current = -1;
  const threshold = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 2;
  chapters.forEach((chapter, index) => {
    if (chapter.getBoundingClientRect().top <= threshold) current = index;
  });
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2) current = chapters.length - 1;
  chapterLinks.forEach((link, index) => {
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

// One scheduled read per frame keeps the chapter indicator in sync with scrolling.
let pendingFrame = false;
window.addEventListener('scroll', () => {
  if (pendingFrame) return;
  pendingFrame = true;
  requestAnimationFrame(() => {
    markChapter();
    pendingFrame = false;
  });
}, { passive: true });
window.addEventListener('resize', markChapter);
markChapter();

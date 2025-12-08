// 실제 보이는 화면 높이를 기준으로 --vh 세팅
function setRealVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('load', setRealVh);
window.addEventListener('resize', setRealVh);
window.addEventListener('orientationchange', setRealVh);

const countdownTargets = document.querySelectorAll('[data-countdown-date]');

/**
 * Renders a D-day style countdown text (D-23) or 오늘 if 0 days left.
 * The string is returned in Korean to match the invitation tone.
 */


function renderCountdown(targetEl) {
  const targetDate = targetEl.getAttribute('data-countdown-date');
  if (!targetDate) return;

  const end = new Date(targetDate);
  const now = new Date();

  const diffMs = end.getTime() - now.getTime();
  if (Number.isNaN(diffMs)) {
    targetEl.textContent = '';
    return;
  }

  const totalSeconds = Math.floor(diffMs / 1000);

  if (totalSeconds < 0) {
    targetEl.textContent = "We're Married!";
    return;
  }

  const daySec = 24 * 60 * 60;
  const days = Math.floor(totalSeconds / daySec);
  const remSeconds = totalSeconds % daySec;

  const hours   = Math.floor(remSeconds / 3600);
  const minutes = Math.floor((remSeconds % 3600) / 60);
  const seconds = remSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (days > 0) {
    targetEl.textContent = `D-${days} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    targetEl.textContent =
      `D-Day ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}

function startCountdown(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  const tick = () => renderCountdown(el);
  tick();
  setInterval(tick, 1000);
}

// 🟢 DOM 준비된 후에 실행
document.addEventListener('DOMContentLoaded', () => {
  startCountdown('#hero-countdown-text');
  setupAccountFold();
});

function setupAccountFold() {
  const toggle = document.querySelector('.account-toggle');
  const body = document.getElementById('account-body');
  if (!toggle || !body) return;

  const icon = toggle.querySelector('.account-toggle__icon');
  const label = toggle.querySelector('.account-toggle__label');

  const closedLabel = body.dataset.labelCollapsed || '계좌 열기';
  const openLabel = body.dataset.labelExpanded || '계좌 접기';

  const updateState = (expanded) => {
    toggle.setAttribute('aria-expanded', String(expanded));
    if (icon) {
      icon.textContent = expanded ? '▾' : '▸';
    }
    if (label) {
      label.textContent = expanded ? openLabel : closedLabel;
    }
    body.classList.toggle('is-collapsed', !expanded);
  };

  updateState(false);

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    updateState(!expanded);
  });
}

countdownTargets.forEach((node) => renderCountdown(node));

// Enable smooth scrolling when clicking floating navigation links.
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const id = anchor.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const GALLERY_PAGE_SIZE = 29;
const KAKAO_SHARE_KEY = '9ad6190b5a0e195986e9a8277530effb';
const galleryGrid = document.getElementById('gallery-grid') || document.querySelector('.gallery-grid');
const galleryPagination = document.getElementById('gallery-pagination') || document.querySelector('.gallery-pagination');

function deriveThumbnailPath(fullPath) {
  if (!fullPath) return '';
  const photosPrefix = 'photos/';
  if (fullPath.startsWith(photosPrefix)) {
    return `thumbnails/${fullPath.slice(photosPrefix.length)}`;
  }
  const marker = '/photos/';
  const markerIndex = fullPath.indexOf(marker);
  if (markerIndex !== -1) {
    const base = fullPath.slice(0, markerIndex + 1);
    const file = fullPath.slice(markerIndex + marker.length);
    return `${base}thumbnails/${file}`;
  }
  return fullPath;
}

function pickGallerySources(image) {
  const fullSrc = image.full || image.src;
  const thumbSrc = image.thumb || deriveThumbnailPath(fullSrc);
  return {
    fullSrc,
    thumbSrc: thumbSrc || fullSrc,
  };
}

let galleryTiles = [];
let lightbox;
let lightboxImage;
let lightboxCloseButton;
let lightboxPrevButton;
let lightboxNextButton;
let lastFocusedElement;
let currentGalleryIndex = -1;
let currentGalleryPage = 1;
let kakaoInitialized = false;

function createLightbox() {
  if (lightbox) return;

  lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.innerHTML = `
    <figure class="gallery-lightbox__figure">
      <img class="gallery-lightbox__image" alt="확대된 사진">
      <button type="button" class="gallery-lightbox__close" aria-label="사진 닫기">&times;</button>
      <button type="button" class="gallery-lightbox__nav gallery-lightbox__nav--prev" aria-label="이전 사진 보기">&#10094;</button>
      <button type="button" class="gallery-lightbox__nav gallery-lightbox__nav--next" aria-label="다음 사진 보기">&#10095;</button>
    </figure>
  `;

  lightboxImage = lightbox.querySelector('.gallery-lightbox__image');
  lightboxCloseButton = lightbox.querySelector('.gallery-lightbox__close');
  lightboxPrevButton = lightbox.querySelector('.gallery-lightbox__nav--prev');
  lightboxNextButton = lightbox.querySelector('.gallery-lightbox__nav--next');

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  lightboxCloseButton.addEventListener('click', () => {
    closeLightbox();
  });

  lightboxPrevButton.addEventListener('click', () => {
    showPreviousImage();
  });

  lightboxNextButton.addEventListener('click', () => {
    showNextImage();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox?.classList.contains('gallery-lightbox--visible')) {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === 'ArrowRight' && lightbox?.classList.contains('gallery-lightbox--visible')) {
      event.preventDefault();
      showNextImage();
    } else if (event.key === 'ArrowLeft' && lightbox?.classList.contains('gallery-lightbox--visible')) {
      event.preventDefault();
      showPreviousImage();
    }
  });

  document.body.appendChild(lightbox);
}

function openLightbox(tile) {
  const imagePath = tile.getAttribute('data-image');
  if (!imagePath) return;

  createLightbox();
  lastFocusedElement = document.activeElement;
  currentGalleryIndex = galleryTiles.indexOf(tile);
  updateLightboxImage(imagePath);
  lightbox.classList.add('gallery-lightbox--visible');
  document.body.classList.add('lightbox-open');
  lightboxCloseButton.focus();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('gallery-lightbox--visible');
  document.body.classList.remove('lightbox-open');
  lightboxImage.src = '';
  currentGalleryIndex = -1;
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

function updateLightboxImage(path) {
  if (!lightboxImage) return;
  lightboxImage.src = path;
}

function showImageAt(index) {
  if (galleryTiles.length === 0) return;
  if (index < 0) {
    index = galleryTiles.length - 1;
  } else if (index >= galleryTiles.length) {
    index = 0;
  }
  const tile = galleryTiles[index];
  const path = tile.getAttribute('data-image');
  if (!path) return;
  currentGalleryIndex = index;
  updateLightboxImage(path);
}

function showNextImage() {
  if (currentGalleryIndex === -1) return;
  showImageAt(currentGalleryIndex + 1);
}

function showPreviousImage() {
  if (currentGalleryIndex === -1) return;
  showImageAt(currentGalleryIndex - 1);
}

function bindGalleryTile(tile) {
  tile.addEventListener('click', () => openLightbox(tile));
  tile.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox(tile);
    }
  });
}

function renderGallery(page = 1) {
  if (!galleryGrid || galleryImages.length === 0) return;

  const totalPages = Math.max(1, Math.ceil(galleryImages.length / GALLERY_PAGE_SIZE));
  currentGalleryPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentGalleryPage - 1) * GALLERY_PAGE_SIZE;
  const pageItems = galleryImages.slice(startIndex, startIndex + GALLERY_PAGE_SIZE);

  const fragment = document.createDocumentFragment();
  pageItems.forEach((image, idx) => {
    const { src, variant, alt, aspect } = image;
    const { fullSrc, thumbSrc } = pickGallerySources(image);

    const tile = document.createElement('div');
    tile.className = `gallery-tile${variant ? ` gallery-tile--${variant}` : ''}`;
    tile.style.setProperty('--gallery-image', `url('${thumbSrc}')`);

    if (thumbSrc !== fullSrc) {
      const thumbImage = new Image();
      thumbImage.onload = () => {
        tile.style.setProperty('--gallery-image', `url('${thumbSrc}')`);
      };
      thumbImage.onerror = () => {
        tile.style.setProperty('--gallery-image', `url('${fullSrc}')`);
      };
      thumbImage.decoding = 'async';
      thumbImage.src = thumbSrc;
    }

    if (aspect) {
      // aspect = width / height (예: 1.5, 0.6667)
      // CSS aspect-ratio도 width / height 이라 그대로 넣으면 됨
      tile.style.aspectRatio = String(aspect);
      // 혹시 숫자로 넣고 싶으면: tile.style.aspectRatio = aspect;
    }

    tile.dataset.image = fullSrc;
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute(
      'aria-label',
      `${alt || `사진 ${startIndex + idx + 1}`} 크게 보기`
    );
    fragment.appendChild(tile);
  });

  galleryGrid.innerHTML = '';
  galleryGrid.appendChild(fragment);
  galleryTiles = Array.from(galleryGrid.querySelectorAll('.gallery-tile'));
  galleryTiles.forEach((tile, index) => {
    tile.setAttribute('data-gallery-index', index);
    bindGalleryTile(tile);
  });

  updateGalleryPagination(totalPages);
}

function updateGalleryPagination(totalPages) {
  if (!galleryPagination) return;
  galleryPagination.innerHTML = '';
  if (totalPages <= 1) {
    galleryPagination.setAttribute('hidden', 'hidden');
    return;
  }
  galleryPagination.removeAttribute('hidden');

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `gallery-pagination__button${page === currentGalleryPage ? ' is-active' : ''}`;
    button.textContent = page;
    button.setAttribute('aria-label', `${page} 페이지 보기`);
    button.addEventListener('click', () => {
      renderGallery(page);
    });
    galleryPagination.appendChild(button);
  }
}

const gallerySection = document.getElementById('gallery');
let galleryRendered = false;

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !galleryRendered) {
      renderGallery();
      galleryRendered = true;
      io.disconnect();
    }
  });
});
io.observe(gallerySection);

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch (error) {
      reject(error);
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('is-visible');

  clearTimeout(showToast._timeout);
  showToast._timeout = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 1300);
}

document.querySelectorAll('.account-copy').forEach((button) => {
  button.addEventListener('click', () => {
    const value = button.getAttribute('data-account-number');
    if (!value) return;
    copyText(value)
      .then(() => showToast('복사되었습니다'))
      .catch(() => alert('복사에 실패했습니다. 다시 시도해주세요.'));
  });
});

const shareLinkButton = document.getElementById('share-link');
if (shareLinkButton) {
  shareLinkButton.addEventListener('click', async () => {
    const shareUrl = window.location.href;

    // 1) Web Share API 지원되면 시스템 공유창 먼저
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: shareUrl,
        });
        return; // 성공했으면 끝
      } catch (err) {
        // 사용자가 취소했으면 그냥 아래 복사로 떨어지게 놔둠
        console.warn('share canceled or failed, fallback to copy', err);
      }
    }

    // 2) 지원 안 되거나 실패하면 기존 로직으로 복사
    copyText(shareUrl)
      .then(() => showToast('링크가 복사되었습니다'))
      .catch(() => showToast('링크를 복사하지 못했습니다. 다시 시도해주세요.'));
  });
}
function initKakaoShare() {
  if (kakaoInitialized) return true;
  if (!window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_SHARE_KEY);
  }
  kakaoInitialized = true;
  return true;
}

const shareKakaoButton = document.getElementById('share-kakao');
if (shareKakaoButton) {
  shareKakaoButton.addEventListener('click', () => {
    if (!initKakaoShare()) {
      alert('카카오톡 공유 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const shareUrl = window.location.href;
    const shareTitle = document.title;
    const { origin, pathname } = window.location;
const basePath = pathname.replace(/\/[^/]*$/, ''); // /invitation-jw-yj
const imageUrl = `${origin}${basePath}/imgs/hero.webp`;
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: shareTitle,
        description: '3월 8일 오후 12:10 여의도 더파티움',
        imageUrl: imageUrl,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl
        }
      },
      buttons: [
        {
          title: '청첩장 열기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl
          }
        }
      ]
    });
  });
}

const KAKAO_MAP_APP_KEY = '9ad6190b5a0e195986e9a8277530effb';

function markMapReady(mapTarget) {
  const wrapper = mapTarget.closest('.map-placeholder');
  if (!wrapper) return;

  wrapper.classList.add('map-placeholder--ready');
  const notice = wrapper.querySelector('.map-placeholder__notice');
  if (notice) {
    notice.setAttribute('hidden', 'hidden');
  }

  mapTarget.removeAttribute('hidden');
}

function renderStaticMap(mapTarget) {
  if (!mapTarget) return false;

  const imageSrc = (mapTarget.dataset.image || '').trim();
  if (!imageSrc) return false;

  const wrapper = mapTarget.closest('.map-placeholder');
  if (!wrapper) return false;

  let imageEl = wrapper.querySelector('.map-placeholder__image');
  if (!imageEl) {
    imageEl = document.createElement('img');
    imageEl.className = 'map-placeholder__image';
    mapTarget.insertAdjacentElement('afterend', imageEl);
  }

  imageEl.src = imageSrc;
  imageEl.alt = mapTarget.dataset.imageAlt || '행사장 약도 이미지';
  imageEl.removeAttribute('hidden');

  mapTarget.setAttribute('hidden', 'hidden');
  wrapper.classList.add('map-placeholder--ready', 'map-placeholder--static');

  const notice = wrapper.querySelector('.map-placeholder__notice');
  if (notice) {
    notice.setAttribute('hidden', 'hidden');
  }

  return true;
}

function initKakaoMap() {
  if (!window.kakao || !window.kakao.maps) return;

  const mapTarget = document.getElementById('kakao-map');
  if (!mapTarget) return;

  const lat = 37.52808497891688;
  const lng = 126.92279872448067;
  const zoom = parseInt(mapTarget.dataset.zoom || '16', 10);
  const level = Math.max(1, Math.min(14, 20 - zoom));
  const center = new kakao.maps.LatLng(lat, lng);

  const map = new kakao.maps.Map(mapTarget, {
    center,
    level,
    draggable: true,
    scrollwheel: true,
    disableDoubleClickZoom: false,
  });

  const zoomControl = new kakao.maps.ZoomControl();
  map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

  const mapTypeControl = new kakao.maps.MapTypeControl();
  map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

  const marker = new kakao.maps.Marker({
    position: center,
    map,
  });
  marker.setPosition(center);

  const overlayContent = document.createElement('div');
  overlayContent.className = 'map-overlay';
  ;

  const overlay = new kakao.maps.CustomOverlay({
    content: overlayContent,
    position: center,
    xAnchor: 0.5,
    yAnchor: 1.35,
  });

  overlay.setMap(map);

  markMapReady(mapTarget);
  setTimeout(() => {
    map.relayout();
    map.setCenter(center);
  }, 100);
}

function handleKakaoMapError() {
  const mapTarget = document.getElementById('kakao-map');
  if (renderStaticMap(mapTarget)) {
    return;
  }

  const notice = document.querySelector('.map-placeholder__notice');
  if (notice) {
    notice.removeAttribute('hidden');
    notice.textContent = '카카오 지도를 불러오지 못했습니다. JavaScript 키와 허용 도메인을 확인해주세요.';
  }
}

function loadKakaoMap() {
  const mapTarget = document.getElementById('kakao-map');
  if (!mapTarget) return;

  const hasKey = KAKAO_MAP_APP_KEY && KAKAO_MAP_APP_KEY !== 'YOUR_KAKAO_MAP_APP_KEY';
  if (!hasKey) {
    renderStaticMap(mapTarget);
    return;
  }

  const existingScript = document.querySelector('script[data-kakaomap]');
  if (existingScript) {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initKakaoMap);
    }
    return;
  }

  const script = document.createElement('script');
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&autoload=false`;
  script.async = true;
  script.defer = true;
  script.dataset.kakaomap = 'true';
  script.onload = () => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initKakaoMap);
    }
  };
  script.onerror = handleKakaoMapError;
  document.head.appendChild(script);
}

loadKakaoMap();

// Calendar button platform handling
const calendarButton = document.getElementById('calendar-button');
if (calendarButton) {
  const googleUrl = calendarButton.getAttribute('data-google');
  const appleUrl = calendarButton.getAttribute('data-apple');
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);

  if (isApple && appleUrl) {
    calendarButton.href = appleUrl;
    calendarButton.setAttribute('download', appleUrl.split('/').pop() || 'event.ics');
    calendarButton.textContent = 'Apple 캘린더에 추가';
    calendarButton.removeAttribute('target');
    calendarButton.removeAttribute('rel');
  } else {
    calendarButton.href = googleUrl || '#';
    calendarButton.removeAttribute('download');
    if (googleUrl) {
      calendarButton.setAttribute('target', '_blank');
      calendarButton.setAttribute('rel', 'noopener');
    }
    calendarButton.textContent = 'Google 캘린더에 추가';

    calendarButton.addEventListener('click', (event) => {
      if (!googleUrl) {
        event.preventDefault();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('rsvp-overlay');
  if (!overlay) return;

  const closeBtn = document.getElementById('rsvp-overlay-close');
  const hideTodayCheckbox = document.getElementById('rsvp-hide-today');

  // 오늘 날짜 문자열 만들기 (YYYY-MM-DD)
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const HIDE_KEY = 'rsvpHideDate';

  // 저장된 날짜가 오늘이면 안 보이게
  const saved = localStorage.getItem(HIDE_KEY);
  if (saved === todayStr) {
    overlay.classList.add('is-hidden');
  } else {
    overlay.classList.remove('is-hidden');
  }

  function closeOverlay() {
    // 체크되어 있으면 오늘 날짜 저장
    if (hideTodayCheckbox && hideTodayCheckbox.checked) {
      localStorage.setItem(HIDE_KEY, todayStr);
    }
    overlay.classList.add('is-hidden');
  }

  closeBtn?.addEventListener('click', closeOverlay);

  // 배경 클릭해도 닫기
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('rsvp-overlay__backdrop')) {
      closeOverlay();
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bgm');
  const btn = document.getElementById('music-toggle');
  if (!audio || !btn) return;

  // 일부 브라우저는 autoplay muted도 실패할 수 있으니 한번 시도
  audio.play().catch(() => {
    // 실패해도 무시
  });

  let muted = true; // 처음엔 muted 상태

  btn.addEventListener('click', () => {
    muted = !muted;
    audio.muted = muted;

    if (!muted) {
      // 소리 켤 때 혹시 멈춰있으면 재생
      audio.play().catch(() => { });
      btn.textContent = '🔊';
      btn.setAttribute('aria-label', '음악 끄기');
    } else {
      btn.textContent = '🔇';
      btn.setAttribute('aria-label', '음악 켜기');
    }
  });
});
